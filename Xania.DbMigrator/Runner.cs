using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
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

        public static void ResetDatabase(string connectionString)
        {
            var services = new DbMigrationServices(connectionString);
            services.ResetDatabase();
        }

        public static void Restore(string bacpacFile, string connectionString)
        {
            ResetDatabase(connectionString);

            var bacPacFile = bacpacFile ?? "Xania.DbMigrator.bacpac";
            var services = new DbMigrationServices(connectionString);
            services.ImportBacpac(bacPacFile);
        }

        //private static async Task<IList<IDbMigration>> GetPendingMigrationsAsync(string connectionString, IEnumerable<IDbMigration> scripts)
        //{
        //    using (var conn = new SqlConnection(connectionString))
        //    {
        //        await conn.OpenAsync();

        //        var existingMigrations = new HashSet<string>(await GetMigrationsAsync(conn));
        //        // ReSharper disable once LocalizableElement
        //        Console.WriteLine("Existing migrations: \n {0}\n",
        //            string.Join("\n ", existingMigrations.OrderByDescending(Identity).Select(e => $"o [{e}]")));
        //        var pendingMigrations = scripts.Where(e => !existingMigrations.Contains(e.Id)).ToArray();

        //        conn.Close();
        //        return pendingMigrations;
        //    }
        //}

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
                ScriptDatabaseOptions = false,
                IgnoreComments = true,
                GenerateSmartDefaults = false,
                
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
                var deployScript = dbServices.GenerateDeployScript(package, sql.InitialCatalog, options: dbDeployOptions);
                Console.Out.WriteLine(deployScript);
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

        private static void Init(string connectionString)
        {
            Console.WriteLine(@"Init Start");
            using (var sql = new SqlConnection(connectionString))
            {
                Console.WriteLine($@"Connect to {connectionString}");
                sql.Open();

                Console.WriteLine($@"Ensure Migration Objects");
                var initTrans = sql.BeginTransaction();
                EnsureDbMigrationObjects(sql, initTrans);
                Console.WriteLine($@"Commit");
                initTrans.Commit();
                sql.Close();
            }
            Console.WriteLine(@"Init End");
        }

        public static void GetPendingScripts(string connectionString, IEnumerable<IDbMigration> upgradeScripts)
        {
            Init(connectionString);

            foreach (var migration in upgradeScripts.OrderBy(x => x.Id))
            {
                Console.WriteLine($@"Execute migration {migration.Id}");
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.OpenAsync();
                    var scriptTrans = conn.BeginTransaction(IsolationLevel.ReadUncommitted);
                    try
                    {
                        migration.Execute(conn, scriptTrans);

                        scriptTrans.Commit();
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine(ex);
                        scriptTrans.Rollback();
                        throw;
                    }
                    conn.Close();
                }
            }
        }

        public static void Upgrade(string connectionString, IEnumerable<IDbMigration> upgradeScripts)
        {
            Init(connectionString);

            foreach (var migration in upgradeScripts.OrderBy(x => x.Id))
            {
                Console.WriteLine($@"Execute migration {migration.Id}");
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    var scriptTrans = conn.BeginTransaction(IsolationLevel.ReadUncommitted);
                    try
                    {
                        migration.Execute(conn, scriptTrans);

                        scriptTrans.Commit();
                    }
                    catch(Exception ex)
                    {
                        Console.Error.WriteLine(ex);
                        scriptTrans.Rollback();
                        throw;
                    }
                    conn.Close();
                }
            }
        }

        private static void EnsureDbMigrationObjects(SqlConnection sql, SqlTransaction trans)
        {
            if (!ObjectExists(sql, trans, "[dbo].[DbMigrationHistory]"))
                new TransactSql(Resources.DbMigrationHistory).Execute(sql, trans);
        }

        private static bool ObjectExists(SqlConnection sql, SqlTransaction trans, string objectName)
        {
            var cmd = sql.CreateCommand();
            cmd.Transaction = trans;
            cmd.CommandText = $"SELECT OBJECT_ID('{objectName}')";
            cmd.CommandType = CommandType.Text;

            var scalar = cmd.ExecuteScalar();
            return scalar != null && !Convert.IsDBNull(scalar);
        }
    }

    public class TransactSqlMigration : IDbMigration
    {
        public readonly string Script;

        public TransactSqlMigration(string id, string script)
        {
            Script = script;
            Id = id;
        }

        public string Id { get; }

        public void Execute(SqlConnection conn, SqlTransaction trans)
        {
            var migrateCmd = conn.CreateCommand();
            migrateCmd.Transaction = trans;
            migrateCmd.CommandText = "SELECT Script FROM dbo.DbMigrationHistory WHERE Id = @Id";
            migrateCmd.Parameters.AddWithValue("@Id", Id);

            var actualScript = migrateCmd.ExecuteScalar();
            if (Convert.IsDBNull(actualScript) || actualScript == null)
            {
                var addMigrateCmd = conn.CreateCommand();
                addMigrateCmd.Transaction = trans;
                addMigrateCmd.CommandText =
                    "INSERT INTO dbo.DbMigrationHistory (Id, [Date], Script) VALUES (@Id, GETDATE(), @Script)";
                addMigrateCmd.Parameters.AddWithValue("@Id", Id);
                addMigrateCmd.Parameters.AddWithValue("@Script", Script);
                addMigrateCmd.ExecuteNonQuery();

                new TransactSql(Script).Execute(conn, trans);
            }
            else if (!string.Equals(actualScript, Script))
            {
                Console.WriteLine($@" @Id : {Id}");
                throw new InvalidOperationException(
                    $"Existing migration {Id} detected a change in upgrade script" +
                    $"\r\n================================================================\r\n" +
                    $"{Script}" +
                    $"\r\n===== Actual Script ============================================\r\n" +
                    $"{actualScript}"
                );
            }
        }

        public static TransactSqlMigration FromFile(string path)
        {
            return FromFile(new FileInfo(path));
        }

        public static TransactSqlMigration FromFile(FileInfo file)
        {
            return FromFile(file.Name.ToLowerInvariant(), file);
        }

        public static TransactSqlMigration FromFile(string id, FileInfo file)
        {
            using (var stream = file.OpenRead())
            using (var reader = new StreamReader(stream))
            {
                return new TransactSqlMigration(id, reader.ReadToEnd());
            }
        }


        public static IEnumerable<IDbMigration> FromDirectory(string parentPath)
        {
            return FromDirectory(new DirectoryInfo(parentPath));
        }

        public static IEnumerable<TransactSqlMigration> FromDirectory(DirectoryInfo parent)
        {
            foreach (var dir in parent.GetDirectories())
            {
                foreach (var child in FromDirectory(dir))
                {
                    yield return new TransactSqlMigration(dir.Name + "." + child.Id, child.Script);
                }
            }

            foreach (var file in parent.GetFiles("*.sql"))
                using (var stream = file.OpenRead())
                using (var reader = new StreamReader(stream))
                {
                    yield return new TransactSqlMigration(file.Name.ToLowerInvariant(), reader.ReadToEnd());
                }
        }

        public static IEnumerable<TransactSqlMigration> FromAssembly(Assembly assembly)
        {
            foreach (var type in assembly.GetTypes().Where(t => typeof(TransactSqlMigration).IsAssignableFrom(t)))
            {
                yield return Activator.CreateInstance(type) as TransactSqlMigration;
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
                            yield return new TransactSqlMigration(parts[1].ToLowerInvariant(), reader.ReadToEnd());
                        }
                }
            }
        }

        public override string ToString()
        {
            return this.Id;
        }
    }

    public class DbMigrationGroup : IDbMigration
    {
        private readonly IEnumerable<IDbMigration> _list;

        public DbMigrationGroup(string id, IEnumerable<IDbMigration> list)
        {
            _list = list;
            Id = id;
        }

        public string Id { get; }

        public void Execute(SqlConnection conn, SqlTransaction trans)
        {
            foreach(var e in _list)
                e.Execute(conn, trans);
        }

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.AppendLine("Group: " + this.Id);
            foreach (var i in _list)
            {
                sb.AppendLine(i.ToString());
            }

            return sb.ToString();
        }
    }
}
