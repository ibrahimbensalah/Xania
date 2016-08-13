using System;
using System.IO;

namespace Xania.DataAccess
{
    public static class StreamRepositoryExtensions
    {
        public static Guid Add(this IStreamRepository streamRepository, string folder, Stream stream)
        {
            var resourceId = Guid.NewGuid();
            streamRepository.Add(folder, resourceId, stream.CopyTo);
            return resourceId;
        }

        public static void Add(this IStreamRepository streamRepository, string folder, Guid resourceId, Stream stream)
        {
            streamRepository.Add(folder, resourceId, stream.CopyTo);
        }

        public static T Read<T>(this IStreamRepository streamRepository, string folder, Guid resourceId, Func<Stream, T> reader)
        {
            var result = default(T);
            streamRepository.Read(folder, resourceId, s =>
            {
                result = reader(s);
            });
            return result;
        }

    }
}