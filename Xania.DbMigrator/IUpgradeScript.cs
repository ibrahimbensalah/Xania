using System.Data.SqlClient;

namespace Xania.DbMigrator
{
    public interface IDbMigration
    {
        string Id { get; }
        void Execute(SqlConnection conn, SqlTransaction trans);
    }
}