using System.Data.SqlClient;
using System.Threading.Tasks;

namespace Xania.DbMigrator
{
    public interface IDbMigration
    {
        string Id { get; }
        Task ExecuteAsync(SqlConnection conn, SqlTransaction trans);
    }
}