using System;
using System.ComponentModel;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Resources;
using System.Text;
using System.Threading.Tasks;using Xania.DbMigrator;
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
        public abstract Task<string> ExecuteAsync(SqlConnection conn, SqlTransaction trans);

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

    public class DbMigration2: IDbMigration
    {
        private readonly Func<Task<string>> _readerFactory;

        public DbMigration2(string id, Func<Task<string>> readerFactory)
        {
            Id = id;
            _readerFactory = readerFactory;
        }

        public string Id { get; }

        private Task<string> GetContentAsync()
        {
            return _readerFactory();
        }

        public async Task<string> ExecuteAsync(SqlConnection conn, SqlTransaction scriptTrans)
        {
            var content = await GetContentAsync();
            Console.WriteLine(@"Execute migration script [{0}]", Id);
            Console.WriteLine(content);
            await new TransactSql(content).ExecuteAsync(conn, scriptTrans);

            return content;
        }

        public static IDbMigration FromResource(string id, Assembly assembly, string resourceName)
        {
            return new DbMigration2(id, () =>
            {
                using (var resourceStream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (resourceStream == null)
                        throw new MissingManifestResourceException();

                    using (var reader = new StreamReader(resourceStream))
                    {
                        return reader.ReadToEndAsync();
                    }
                }
            });

        }
    }
}