using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Xania.DbMigrator.Helpers
{
    public class TransactSql
    {
        private readonly string _script;

        public TransactSql(string script)
        {
            _script = script;
        }

        public void Execute(string connectionString)
        {
            ExecuteAsync(connectionString).Wait();
        }

        public async Task ExecuteAsync(string connectionString)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                using (var trans = conn.BeginTransaction())
                {
                    await ExecuteAsync(conn, trans);
                    trans.Commit();
                }
                conn.Close();
            }
        }

        public string Execute(SqlConnection conn, SqlTransaction trans)
        {
            foreach (var part in Regex.Split(_script, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase).Select(e => e.Trim()))
            {
                if (string.IsNullOrEmpty(part))
                    continue;

                var cmd = conn.CreateCommand();
                cmd.Transaction = trans;
                cmd.CommandText = part;
                cmd.CommandType = CommandType.Text;
                cmd.CommandTimeout = 600;

                cmd.ExecuteNonQuery();
            }

            return _script;
        }

        public async Task<string> ExecuteAsync(SqlConnection conn, SqlTransaction trans)
        {
            foreach (var part in Regex.Split(_script, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase).Select(e => e.Trim()))
            {
                if (string.IsNullOrEmpty(part))
                    continue;

                var cmd = conn.CreateCommand();
                cmd.Transaction = trans;
                cmd.CommandText = part;
                cmd.CommandType = CommandType.Text;
                cmd.CommandTimeout = 600;

                await cmd.ExecuteNonQueryAsync();
            }

            return _script;
        }

        public static TransactSql FromFile(string file)
        {
            return new TransactSql(File.ReadAllText(file));
        }
    }
}
