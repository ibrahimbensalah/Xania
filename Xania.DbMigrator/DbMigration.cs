using System.ComponentModel;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Resources;
using System.Text;
using System.Threading.Tasks;
using Xania.DbMigrator.Helpers;

namespace Xania.DbMigrator
{
    public abstract class DbMigration : IDbMigration
    {
        protected DbMigration(string id)
        {
            Id = id;
        }

        protected DbMigration()
        {
            var attr = TypeDescriptor.GetAttributes(this.GetType()).OfType<DbMigrationAttribute>().SingleOrDefault();
            if (attr != null)
            {
                Id = attr.Id;
            }
        }

        public string Id { get; }
        public abstract void Execute(SqlConnection conn, SqlTransaction trans);

        protected TransactSql ResourceScript(string scriptName)
        {
            var resourceName = this.GetType().Namespace + "." + scriptName;
            var assembly = this.GetType().Assembly;
            using (var resourceStream = assembly.GetManifestResourceStream(resourceName))
            {
                if (resourceStream == null)
                    throw new MissingManifestResourceException(resourceName);

                using (var reader = new StreamReader(resourceStream))
                {
                    return new TransactSql(reader.ReadToEnd());
                }
            }
        }

        public static Task<string> ConcatAsync(params Task<string>[] tasks)
        {
            // ReSharper disable once CoVariantArrayConversion
            Task.WaitAll(tasks);
            var builder = new StringBuilder();
            foreach (var t in tasks)
                builder.AppendLine(t.Result);

            return Task.FromResult(builder.ToString());
        }
    }
}