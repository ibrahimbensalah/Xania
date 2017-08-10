using System;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text.RegularExpressions;
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


        public async Task ImportBacpac(string bacpacFileName)
        {
            Console.WriteLine($@"Restoring backup....");

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (var trans = conn.BeginTransaction())
                {
                    await new TransactSql(Resources.truncate_db).ExecuteAsync(conn, trans);
                    trans.Commit();
                }
            }

            var dbServices = new DacServices(_masterConnectionString);
            dbServices.ImportBacpac(BacPackage.Load(bacpacFileName), _databaseName);
        }

        public void ExportBacpac(string bacpacFileName)
        {
            Console.WriteLine($@"Generating backup....");

            var dbServices = new DacServices(_masterConnectionString);
            dbServices.ExportBacpac(bacpacFileName, _databaseName);
        }


    }
}
