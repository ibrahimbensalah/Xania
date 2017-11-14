using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.SqlServer.Dac;
using Xania.DbMigrator.Core.Properties;

namespace Xania.DbMigrator.Core.Helpers
{
    public class DbMigrationServices
    {
        private readonly string _connectionString;
        private readonly string _masterConnectionString;
        private readonly string _databaseName;

        public DbMigrationServices(string connectionString)
        {
            _connectionString = connectionString;
            var connectionBuilder = new SqlConnectionStringBuilder(connectionString);
            var targetDatabase = connectionBuilder.InitialCatalog;
            connectionBuilder.InitialCatalog = "master";

            _masterConnectionString = connectionBuilder.ConnectionString;
            _databaseName = targetDatabase;
        }


        public async Task ImportBacpac(string bacpacFileName)
        {
            Console.WriteLine($@"Restoring backup....");

            using (var conn = new SqlConnection(_masterConnectionString))
            {
                await conn.OpenAsync();
                if (!CreateDatabaseIfNotExists(conn, _databaseName))
                {
                    conn.ChangeDatabase(_databaseName);
                    Console.WriteLine($@"Truncate database {_databaseName}");
                    using (var trans = conn.BeginTransaction())
                    {
                        await new TransactSql(Resources.truncate_db).ExecuteAsync(conn, trans);
                        trans.Commit();
                    }
                }
                conn.Close();
            }

            var dbServices = new DacServices(_masterConnectionString);
            dbServices.ImportBacpac(BacPackage.Load(bacpacFileName), _databaseName);
        }

        public static bool CreateDatabaseIfNotExists(SqlConnection conn, string databaseName)
        {
            Console.WriteLine($@"CREATE DATABASE {databaseName} IF NOT EXISTS");
            using (var command = new SqlCommand($"SELECT db_id(@databaseName)", conn))
            {
                command.Parameters.Add(new SqlParameter
                {
                    ParameterName = "@databaseName",
                    DbType = DbType.String,
                    Value = databaseName
                });
                var exists = command.ExecuteScalar() != DBNull.Value;
                Console.WriteLine($@"DATABASE {databaseName} Exists = {exists}");
                if (exists)
                    return false;
            }

            Console.WriteLine($@"CREATE DATABASE {databaseName}");
            using (var command = new SqlCommand("exec ('CREATE DATABASE ' + @databaseName)", conn))
            {
                command.Parameters.Add(new SqlParameter
                {
                    ParameterName = "@databaseName",
                    DbType = DbType.String,
                    Value = databaseName
                });
                command.ExecuteNonQuery();
            }
            return true;
        }


        public void ExportBacpac(string bacpacFile)
        {
            Console.WriteLine($@"Generating backup....");

            var dbServices = new DacServices(_connectionString);
            dbServices.Message += (sender, evt) => Console.WriteLine(evt.Message);
            dbServices.ExportBacpac(bacpacFile, _databaseName);
        }

        public void PublishDacpac(string dacpacFile)
        {
            Console.WriteLine($@"Publish dacpac file: {dacpacFile}");

            var dbServices = new DacServices(_masterConnectionString);
            dbServices.Publish(DacPackage.Load(dacpacFile), _databaseName, new PublishOptions
            {
            });
        }
    }
}
