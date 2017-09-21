using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.SqlServer.Dac;
using Xania.DbMigrator.Helpers;
using Xania.DbMigrator.Properties;

namespace Xania.DbMigrator
{
    public class Runner
    {
        public static void BackUp(string bacpacFile, string connectionString)
        {
            var bacPacFile = bacpacFile ?? "Xania.DbMigrator.bacpac";
            new DbMigrationServices(connectionString).ExportBacpac(bacPacFile);
        }

        private static IEnumerable<IDbMigration> GetDbMigrations(Assembly assembly)
        {
            foreach (var type in assembly.GetTypes().Where(t => typeof(IDbMigration).IsAssignableFrom(t)))
            {
                yield return Activator.CreateInstance(type) as IDbMigration;
            }

            foreach (var resourcePath in assembly.GetManifestResourceNames())
            {
                var parts = resourcePath.Split('.').Reverse().ToArray();

                if (parts.Length < 3 || !string.Equals(parts[0], "sql"))
                    continue;

                if (string.Equals(parts[2], "Migrations"))
                {
                    var stream = assembly.GetManifestResourceStream(resourcePath);
                    if (stream != null)
                        using (var reader = new StreamReader(stream))
                        {
                            var script = new TransactSql(reader.ReadToEnd());
                            yield return new TransactSqlMigration(parts[1].ToLowerInvariant(), script);
                        }
                }
            }
        }

        public static Task RestoreAsync(string bacpacFile, string connectionString)
        {
            var bacPacFile = bacpacFile ?? "Xania.DbMigrator.bacpac";
            return new DbMigrationServices(connectionString).ImportBacpac(bacPacFile);
        }

        private static async Task<IList<IDbMigration>> GetPendingMigrationsAsync(string connectionString, IEnumerable<IDbMigration> scripts)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();

                var existingMigrations = new HashSet<string>(await GetMigrationsAsync(conn));
                // ReSharper disable once LocalizableElement
                Console.WriteLine("Existing migrations: \n {0}\n",
                    string.Join("\n ", existingMigrations.OrderByDescending(Identity).Select(e => $"o [{e}]")));
                var pendingMigrations = scripts.Where(e => !existingMigrations.Contains(e.Id)).ToArray();

                conn.Close();
                return pendingMigrations;
            }
        }

        public static bool ValidateDac(string dacpacPath, string targetConnectionString)
        {
            if (string.IsNullOrEmpty(dacpacPath))
                return true;

            if (!File.Exists(dacpacPath))
            {
                Console.Error.WriteLine($"Specified dacpac '{dacpacPath}' not found");
                return false;
            }

            Console.WriteLine($@"Validate dacpac {dacpacPath}");

            var package = DacPackage.Load(dacpacPath);
            var dbDeployOptions = new DacDeployOptions
            {
                BlockOnPossibleDataLoss = false,
                ScriptDatabaseOptions = false
            };

            var sql = new SqlConnectionStringBuilder(targetConnectionString);

            var dbServices = new DacServices(targetConnectionString);
            var reportXml = dbServices.GenerateDeployReport(package, sql.InitialCatalog, options: dbDeployOptions);

            var doc = new XmlDocument();
            doc.LoadXml(reportXml);

            using (var writer = new XmlTextWriter(Console.Out))
            {
                writer.Formatting = Formatting.Indented;
                doc.WriteContentTo(writer);
            }
            Console.WriteLine();

            var path = new[] { "DeploymentReport", "Operations", "Operation" };
            var operations = path.Aggregate(new[] { doc }.OfType<XmlNode>(),
                (parents, name) => parents.SelectMany(parent => parent.ChildNodes.OfType<XmlNode>()
                    .Where(c => c.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))).ToArray();

            if (operations.Any())
            {
                Console.Error.WriteLine(@"Validation failed: One or more pending database operation were found.");
                return false;
            }
            return true;
        }

        public static void PublishDac(string dacpacFile, string connectionString)
        {
            if (string.IsNullOrEmpty(dacpacFile))
                Console.Error.WriteLine("Publishing requires dacpac to be specified");
            else
                new DbMigrationServices(connectionString).PublishDacpac(dacpacFile);
        }

        private static async Task InitAsync(string connectionString)
        {
            using (var sql = new SqlConnection(connectionString))
            {
                await sql.OpenAsync();

                var initTrans = sql.BeginTransaction();
                await EnsureDbMigrationObjectsAsync(sql, initTrans);
                initTrans.Commit();
            }

        }

        public static void Upgrade(string connectionString, Assembly assembly)
        {
            Upgrade(connectionString, GetDbMigrations(assembly));
        }

        public static void Upgrade(string connectionString, IEnumerable<IDbMigration> upgradeScripts)
        {
            InitAsync(connectionString).Wait();

            UpgradeAsync(connectionString, upgradeScripts).Wait();
        }

        private static async Task UpgradeAsync(string connectionString, IEnumerable<IDbMigration> upgradeScripts)
        {
            var pendingMigrations = await GetPendingMigrationsAsync(connectionString, upgradeScripts.OrderBy(x => x.Id));
            if (!pendingMigrations.Any())
            {
                Console.WriteLine(@"No pending migrations.");
                return;
            }

            using (var conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                var scriptTrans = conn.BeginTransaction(IsolationLevel.ReadUncommitted);
                try
                {
                    foreach (var migration in pendingMigrations)
                    {
                        Console.WriteLine($@"Execute migration {migration.Id}");
                        var content = await migration.ExecuteAsync(conn, scriptTrans);
                        await AddMigrationAsync(conn, scriptTrans, migration.Id, content);
                    }

                    scriptTrans.Commit();
                }
                catch
                {
                    scriptTrans.Rollback();
                    throw;
                }
                conn.Close();
            }
        }

        private static async Task<IList<string>> GetMigrationsAsync(SqlConnection conn)
        {
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT Id FROM DbMigrationHistory ORDER BY Id";
            cmd.CommandType = CommandType.Text;

            var result = new List<string>();
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    result.Add(reader.GetString(0).Trim());
                }
            }
            return result;
        }

        private static async Task EnsureDbMigrationObjectsAsync(SqlConnection sql, SqlTransaction trans)
        {
            if (!await ObjectExistsAsync(sql, trans, "[dbo].[DbMigrationHistory]"))
                await new TransactSql(Resources.DbMigrationHistory).ExecuteAsync(sql, trans);

            if (!await ObjectExistsAsync(sql, trans, "[dbo].[add_migration]"))
                await new TransactSql(Resources.add_migration).ExecuteAsync(sql, trans);
        }

        private static async Task<bool> ObjectExistsAsync(SqlConnection sql, SqlTransaction trans, string objectName)
        {
            var cmd = sql.CreateCommand();
            cmd.Transaction = trans;
            cmd.CommandText = $"SELECT OBJECT_ID('{objectName}')";
            cmd.CommandType = CommandType.Text;

            var scalar = await cmd.ExecuteScalarAsync();
            return scalar != null && !Convert.IsDBNull(scalar);
        }

        private static IEnumerable<string> GetFiles(string path)
        {
            var attr = File.GetAttributes(path);
            if ((attr & FileAttributes.Directory) != 0)
            {
                foreach (var file in Directory.GetFiles(path))
                    yield return file;
            }
            else
            {
                yield return path;
            }
        }

        private static async Task AddMigrationAsync(SqlConnection conn, SqlTransaction trans, string id, string content)
        {
            var migrateCmd = conn.CreateCommand();
            migrateCmd.Transaction = trans;
            migrateCmd.CommandText = "add_migration";
            migrateCmd.CommandType = CommandType.StoredProcedure;
            migrateCmd.Parameters.AddWithValue("Id", id);
            migrateCmd.Parameters.AddWithValue("Script", content);

            await migrateCmd.ExecuteNonQueryAsync();
        }

        private static T Identity<T>(T e)
        {
            return e;
        }
    }

    internal class TransactSqlMigration : IDbMigration
    {
        private readonly TransactSql _script;

        public TransactSqlMigration(string id, TransactSql script)
        {
            _script = script;
            Id = id;
        }

        public string Id { get; }

        public Task<string> ExecuteAsync(SqlConnection conn, SqlTransaction trans)
        {
            return _script.ExecuteAsync(conn, trans);
        }
    }
}
