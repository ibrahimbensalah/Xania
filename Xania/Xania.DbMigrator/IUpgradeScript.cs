using System.Data.SqlClient;
using System.Threading.Tasks;

namespace Xania.DbMigrator
{
    public interface IDbMigration
    {
        string Id { get; }
        Task<string> ExecuteAsync(SqlConnection conn, SqlTransaction trans);
    }
}