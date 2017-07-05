using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public class MemoryDocumentStore : IDocumentStore
    {
        private readonly IDictionary<string, IList<Record>> _root = new Dictionary<string, IList<Record>>();

        private IList<Record> GetRecords(string folder)
        {
            IList<Record> records;
            if (!_root.TryGetValue(folder, out records))
            {
                records = new List<Record>();
                _root.Add(folder, records);
            }
            return records;
        }

        public Task AddAsync(string folder, string resourceId, Action<Stream> copyTo)
        {
            var mem = new MemoryStream();
            copyTo(mem);
            GetRecords(folder).Add(new Record()
            {
                ResourceId = resourceId,
                Content = mem.ToArray()
            });

            return Task.CompletedTask;
        }

        public Stream OpenWrite(string folder, string resourceId)
        {
            var stream = new DocumentStream();
            stream.OnComplete += (sender, content) =>
            {
                GetRecords(folder).Add(new Record
                {
                    ResourceId = resourceId,
                    Content = content
                });
            };

            return stream;
        }

        public Stream OpenRead(string folder, string resourceId)
        {
            var content = GetRecords(folder).Where(e => e.ResourceId.Equals(resourceId)).Select(e => e.Content)
                .First();
            return new DocumentStream(content);
        }

        public Task<T> ReadAsync<T>(string folder, string resourceId, Func<Stream, T> reader)
        {
            var content = GetRecords(folder).Where(e => e.ResourceId.Equals(resourceId)).Select(e => e.Content)
                .First();
            return Task.FromResult(reader(new MemoryStream(content)));
        }

        public IEnumerable<string> List(string folder)
        {
            return GetRecords(folder).Select(e => e.ResourceId);
        }

        public Task UpdateAsync(string folder, string resourceId, Action<Stream> copyTo)
        {
            var mem = new MemoryStream();
            copyTo(mem);
            var record = GetRecords(folder).First(e => e.ResourceId.Equals(resourceId));
            record.Content = mem.ToArray();

            return Task.CompletedTask;
        }

        public Task DeleteAsync(string folder, string resourceId)
        {
            var records = GetRecords(folder);
            var record = records.First(e => e.ResourceId.Equals(resourceId));
            records.Remove(record);

            return Task.CompletedTask;
        }

        private class Record
        {
            public string ResourceId { get; set; }
            public byte[] Content { get; set; }
        }

    }

    class DocumentStream : Stream
    {
        private readonly MemoryStream _mem;
        private bool _disposed = false;


        public DocumentStream()
        {
            _mem = new MemoryStream();
        }

        public DocumentStream(byte[] content)
        {
            _mem = new MemoryStream(content);
        }

        public override void Flush()
        {
            _mem.Flush();
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            return _mem.Read(buffer, offset, count);
        }

        public override long Seek(long offset, SeekOrigin origin)
        {
            return _mem.Seek(offset, origin);
        }

        public override void SetLength(long value)
        {
            _mem.SetLength(value);
        }

        public override void Write(byte[] buffer, int offset, int count)
        {
            _mem.Write(buffer, offset, count);
        }

        public override bool CanRead => _mem.CanRead;
        public override bool CanSeek => _mem.CanSeek;
        public override bool CanWrite { get; } = true;
        public override long Length => _mem.Length;
        public override long Position
        {
            get => _mem.Position;
            set => _mem.Position = value;
        }

        public event EventHandler<byte[]> OnComplete;

        protected override void Dispose(bool disposing)
        {
            if (_disposed)
                throw new InvalidOperationException("Stream is already disposed.");
            _disposed = true;
            _mem.Dispose();
            OnComplete?.Invoke(this, _mem.ToArray());
        }
    }
}
