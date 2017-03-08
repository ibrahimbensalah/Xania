using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public class DiskDocumentStore : IDocumentStore
    {
        private readonly string _rootDirectory;
        private static readonly object SyncObject = new object();

        public DiskDocumentStore(string rootDirectory)
        {
            _rootDirectory = rootDirectory;
        }

        public Task AddAsync(string folder, string resourceId, Func<Stream, Task> writer)
        {
            lock (SyncObject)
            {
                Directory.CreateDirectory(_rootDirectory);
                var filePath = GetFilePath(folder, resourceId);
                using (var fileStream = File.OpenWrite(filePath))
                {
                    var task = writer(fileStream);
                    fileStream.Flush();

                    return task;
                }
            }
        }

        public T Read<T>(string folder, string resourceId, Func<Stream, T> reader)
        {
            lock (SyncObject)
            {
                using (var stream = File.OpenRead(GetFilePath(folder, resourceId)))
                {
                    return reader(stream);
                }
            }
        }

        private string GetFilePath(string folder, string resourceId)
        {
            var dir = Path.Combine(_rootDirectory, folder);
            Directory.CreateDirectory(dir);
            var filePath = Path.Combine(dir, resourceId + ".xn");
            return filePath;
        }

        public IEnumerable<string> List(string folder)
        {
            var dir = string.IsNullOrEmpty(folder)
                ? _rootDirectory
                : Path.Combine(_rootDirectory, folder);

            if (!Directory.Exists(dir))
                return Enumerable.Empty<string>();

            return
                Directory.GetFiles(dir, "*.xn")
                    .Select(fileName => new FileInfo(fileName))
                    .Select(file => file.Name.Substring(0, file.Name.Length - ".xn".Length));
        }

        //internal class FileReadStream : Stream
        //{
        //    private readonly Stream _inner;

        //    public FileReadStream(Stream inner)
        //    {
        //        _inner = inner;
        //    }

        //    public override void Flush()
        //    {
        //        lock (_syncObject)
        //        {
        //            _inner.Flush();
        //        }
        //    }

        //    public override long Seek(long offset, SeekOrigin origin)
        //    {
        //        lock (_syncObject)
        //        {
        //            return _inner.Seek(offset, origin);
        //        }
        //    }

        //    public override void SetLength(long value)
        //    {
        //        lock (_syncObject)
        //        {
        //            _inner.SetLength(value);
        //        }
        //    }

        //    public override int Read(byte[] buffer, int offset, int count)
        //    {
        //        lock (_syncObject)
        //        {
        //            return _inner.Read(buffer, offset, count);
        //        }
        //    }

        //    public override void Write(byte[] buffer, int offset, int count)
        //    {
        //        lock (_syncObject)
        //        {
        //            _inner.Write(buffer, offset, count);
        //        }
        //    }

        //    public override bool CanRead
        //    {
        //        get { return _inner.CanRead; }
        //    }

        //    public override bool CanSeek
        //    {
        //        get { return _inner.CanSeek; }
        //    }

        //    public override bool CanWrite
        //    {
        //        get { return _inner.CanWrite; }
        //    }

        //    public override long Length
        //    {
        //        get { return _inner.Length; }
        //    }

        //    public override long Position
        //    {
        //        get { return _inner.Position; }
        //        set { _inner.Position = value; }
        //    }
        //}
    }
}