using System;
using System.IO;

namespace Xania.DataAccess
{
    public static class StreamRepositoryExtensions
    {
        public static string Add(this IDocumentStore documentStore, string folder, Stream stream)
        {
            var resourceId = Guid.NewGuid().ToString("N");
            documentStore.Add(folder, resourceId, stream.CopyTo);
            return resourceId;
        }

        public static void Add(this IDocumentStore documentStore, string folder, string resourceId, Stream stream)
        {
            documentStore.Add(folder, resourceId, stream.CopyTo);
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