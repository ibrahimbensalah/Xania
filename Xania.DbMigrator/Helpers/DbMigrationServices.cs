using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.SqlServer.Dac;
using Xania.DbMigrator.Properties;

namespace Xania.DbMigrator.Helpers
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

        public void ResetDatabase()
        {
            using (var conn = new SqlConnection(_masterConnectionString))
            {
                conn.Open();
                if (!CreateDatabaseIfNotExists(conn, _databaseName))
                {
                    conn.ChangeDatabase(_databaseName);
                    Console.WriteLine($@"Truncate database {_databaseName}");
                    using (var trans = conn.BeginTransaction())
                    {
                        new TransactSql(Resources.truncate_db).Execute(conn, trans);
                        trans.Commit();
                    }
                }
                conn.Close();
            }
        }

        //public async Task ResetDatabaseAsync()
        //{
        //    using (var conn = new SqlConnection(_masterConnectionString))
        //    {
        //        // await conn.OpenAsync();
        //        //if (!CreateDatabaseIfNotExists(conn, _databaseName))
        //        //{
        //        //    conn.ChangeDatabase(_databaseName);
        //        //    Console.WriteLine($@"Truncate database {_databaseName}");
        //        //    using (var trans = conn.BeginTransaction())
        //        //    {
        //        //        await new TransactSql(Resources.truncate_db).ExecuteAsync(conn, trans);
        //        //        trans.Commit();
        //        //    }
        //        //}
        //        conn.Close();
        //    }
        //}

        public void ImportBacpac(string bacpacFileName)
        {
            Console.WriteLine($@"Restoring backup....");

            var dbServices = new DacServices(_connectionString);
            dbServices.ImportBacpac(BacPackage.Load(bacpacFileName), _databaseName, new DacImportOptions{});
        }

        public bool CreateDatabaseIfNotExists(string connectionString, string databaseName)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                return CreateDatabaseIfNotExists(conn, databaseName);
            }
        }

        private bool CreateDatabaseIfNotExists(SqlConnection conn, string databaseName)
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

            CreateDatabase(conn, databaseName);
            return true;
        }

        public void CreateDatabase(string connectionString, string databaseName)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                CreateDatabase(conn, databaseName);
            }
        }

        private void CreateDatabase(SqlConnection conn, string databaseName)
        {
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
        }


        public void ExportBacpac(string bacpacFile)
        {
            Console.WriteLine($@"Generating backup....");

            var dbServices = new DacServices(_connectionString);
            dbServices.Message += (sender, evt) => Console.WriteLine(evt.Message);
            dbServices.ExportBacpac(bacpacFile, _databaseName);
        }

        public void ExtractSchema(string dacpacFile, string applicationName)
        {
            Console.WriteLine($@"Generating schema....");

            var dbServices = new DacServices(_connectionString);
            dbServices.Message += (sender, evt) => Console.WriteLine(evt.Message);
            dbServices.Extract(dacpacFile, _databaseName, applicationName, new Version(1, 0));
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
