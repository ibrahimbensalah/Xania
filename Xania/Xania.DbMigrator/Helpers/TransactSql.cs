using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
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

                await cmd.ExecuteNonQueryAsync();
            }

            return _script;
        }
    }
}
