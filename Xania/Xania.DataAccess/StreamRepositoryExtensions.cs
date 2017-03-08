using System;
using System.IO;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public static class StreamRepositoryExtensions
    {
        public static string Add(this IDocumentStore documentStore, string folder, Stream stream)
        {
            var resourceId = Guid.NewGuid().ToString("N");
            documentStore.AddAsync(folder, resourceId, stream.CopyToAsync);
            return resourceId;
        }

        public static Task AddAsync(this IDocumentStore documentStore, string folder, string resourceId, Stream stream)
        {
            return documentStore.AddAsync(folder, resourceId, stream.CopyToAsync);
        }

        public static Stream Read(this IDocumentStore documentStore, string folder, string resourceId, Action<Stream> reader)
        {
            return documentStore.Read(folder, resourceId, x =>
            {
                reader(x);
                return x;
            });
        }

    }
}