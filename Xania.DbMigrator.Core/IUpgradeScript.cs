using System.Data.SqlClient;
using System.Threading.Tasks;

namespace Xania.DbMigrator.Core
{
    public interface IDbMigration
    {
        string Id { get; }
        Task ExecuteAsync(SqlConnection conn, SqlTransaction trans);
    }
}