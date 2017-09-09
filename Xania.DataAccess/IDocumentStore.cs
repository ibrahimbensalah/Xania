using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public interface IDocumentStore
    {
        Stream OpenWrite(string folder, string resourceId);
        Stream OpenRead(string folder, string resourceId);

        // Task<T> ReadAsync<T>(string folder, string resourceId, Func<Stream, T> reader);
        IEnumerable<string> List(string folder);
        // Task UpdateAsync(string folder, string resourceId, Action<Stream> copyTo);
        Task DeleteAsync(string folder, string resourceId);
    }

    public interface IDocument
    {
        Stream OpenWrite();
    }

    public class DiskDocument : IDocument
    {
        private readonly string _filePath;

        public DiskDocument(string filePath)
        {
            _filePath = filePath;
        }

        public Stream OpenWrite()
        {
            return File.OpenWrite(_filePath);
        }
    }

    //public class MemoryDocumentStore : IDocumentStore
    //{
    //    private readonly IDictionary<ListKey, MemoryStream> _streams = new Dictionary<ListKey, MemoryStream>();

    //    public Task AddAsync(string folder, string resourceId, Func<Stream, Task> writer)
    //    {
    //        var key = new ListKey(folder, resourceId);
    //        var mem = new MemoryStream();
    //        _streams[key] = mem;

    //        return writer(mem);
    //    }

    //    public async T ReadAsync<T>(string folder, string resourceId, Func<Stream, T> reader)
    //    {
    //        var key = new ListKey(folder, resourceId);
    //        MemoryStream mem;
    //        if (_streams.TryGetValue(key, out mem))
    //        {
    //            mem.Seek(0, SeekOrigin.Begin);
    //            return reader(mem);
    //        }
    //        else
    //        {
    //            throw new ArgumentException("not found");
    //        }
    //    }

    //    public IEnumerable<string> List(string folder)
    //    {
    //        return _streams.Keys.Where(k => object.Equals(k[0], folder)).Select(k => (string)k[1]);
    //    }

    //    private class ListKey
    //    {
    //        private bool Equals(ListKey other)
    //        {
    //            if (_keys.Length != other._keys.Length)
    //                return false;

    //            // ReSharper disable once LoopCanBeConvertedToQuery
    //            for (var i = 0; i < _keys.Length; i++)
    //            {
    //                if (!Equals(_keys[i], other._keys[i]))
    //                    return false;
    //            }

    //            return true;
    //        }

    //        public override bool Equals(object obj)
    //        {
    //            if (ReferenceEquals(null, obj)) return false;
    //            if (ReferenceEquals(this, obj)) return true;
    //            if (obj.GetType() != this.GetType()) return false;
    //            return Equals((ListKey) obj);
    //        }

    //        public override int GetHashCode()
    //        {
    //            int hashCode = 0;
    //            foreach (var k in _keys)
    //            {
    //                hashCode += k.GetHashCode();
    //            }
    //            return hashCode;
    //        }

    //        private readonly object[] _keys;

    //        public ListKey(params object[] keys)
    //        {
    //            if (keys == null) 
    //                throw new ArgumentNullException("keys");

    //            _keys = keys;
    //        }

    //        public object this[int index]
    //        {
    //            get { return _keys[index]; }
    //        }
    //    }
    //}
}