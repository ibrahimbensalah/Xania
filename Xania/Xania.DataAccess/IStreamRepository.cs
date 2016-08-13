using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Xania.DataAccess
{
    public interface IStreamRepository
    {
        void Add(string folder, Guid resourceId, Action<Stream> writer);
        void Read(string folder, Guid resourceId, Action<Stream> reader);
        IEnumerable<Guid> List(string folder);
    }

    public class MemoryStreamRepository : IStreamRepository
    {
        private readonly IDictionary<ListKey, MemoryStream> _streams = new Dictionary<ListKey, MemoryStream>();

        public void Add(string folder, Guid resourceId, Action<Stream> writer)
        {
            var key = new ListKey(folder, resourceId);
            var mem = new MemoryStream();
            writer(mem);
            _streams[key] = mem;
        }

        public void Read(string folder, Guid resourceId, Action<Stream> reader)
        {
            var key = new ListKey(folder, resourceId);
            MemoryStream mem;
            if (_streams.TryGetValue(key, out mem))
            {
                mem.Seek(0, SeekOrigin.Begin);
                reader(mem);
            }
            else
            {
                throw new ArgumentException("not found");
            }
        }

        public IEnumerable<Guid> List(string folder)
        {
            return _streams.Keys.Where(k => object.Equals(k[0], folder)).Select(k => (Guid)k[1]);
        }

        private class ListKey
        {
            private bool Equals(ListKey other)
            {
                if (_keys.Length != other._keys.Length)
                    return false;

                // ReSharper disable once LoopCanBeConvertedToQuery
                for (var i = 0; i < _keys.Length; i++)
                {
                    if (!Equals(_keys[i], other._keys[i]))
                        return false;
                }

                return true;
            }

            public override bool Equals(object obj)
            {
                if (ReferenceEquals(null, obj)) return false;
                if (ReferenceEquals(this, obj)) return true;
                if (obj.GetType() != this.GetType()) return false;
                return Equals((ListKey) obj);
            }

            public override int GetHashCode()
            {
                int hashCode = 0;
                foreach (var k in _keys)
                {
                    hashCode += k.GetHashCode();
                }
                return hashCode;
            }

            private readonly object[] _keys;

            public ListKey(params object[] keys)
            {
                if (keys == null) 
                    throw new ArgumentNullException("keys");

                _keys = keys;
            }

            public object this[int index]
            {
                get { return _keys[index]; }
            }
        }
    }
}