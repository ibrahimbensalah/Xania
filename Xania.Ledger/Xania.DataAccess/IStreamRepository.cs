using System;
using System.Collections.Generic;
using System.IO;

namespace Xania.DataAccess
{
    public interface IStreamRepository
    {
        void Add(string folder, Guid resourceId, Action<Stream> writer);
        void Read(string folder, Guid resourceId, Action<Stream> reader);
        IEnumerable<Guid> List(string folder);
    }
}