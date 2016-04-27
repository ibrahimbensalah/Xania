using System;
using System.IO;

namespace Xania.DataAccess
{
    public interface IStreamRepository
    {
        void Add(string folder, Guid resourceId, Action<Stream> writer);
        Stream Get(string folder, Guid resourceId);
    }
}