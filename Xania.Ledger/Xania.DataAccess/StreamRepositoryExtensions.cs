using System;
using System.IO;

namespace Xania.DataAccess
{
    public static class StreamRepositoryExtensions
    {
        public static Guid Add(this IStreamRepository streamRepository, Stream stream)
        {
            var resourceId = Guid.NewGuid();
            streamRepository.Add(resourceId, stream);
            return resourceId;
        }
    }
}