using System;
using System.IO;

namespace Xania.DataAccess
{
    public interface IStreamRepository
    {
        void Add(Guid resourceId, Stream contentStream);
        Stream Get(Guid resourceId);
    }
}