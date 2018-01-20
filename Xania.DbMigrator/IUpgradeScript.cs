using System.Data.SqlClient;
using System.Threading.Tasks;

namespace Xania.DbMigrator
{
    public interface IDbMigration
    {
        string Id { get; }
        void Execute(SqlConnection conn, SqlTransaction trans);
    }
}