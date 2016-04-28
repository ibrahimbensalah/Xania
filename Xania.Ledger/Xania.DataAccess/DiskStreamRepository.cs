using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Xania.DataAccess
{
    public class DiskStreamRepository : IStreamRepository
    {
        private readonly string _rootDirectory;
        private static object _syncObject = new object();

        public DiskStreamRepository(string rootDirectory)
        {
            _rootDirectory = rootDirectory;
        }

        public void Add(string folder, Guid resourceId, Action<Stream> writer)
        {
            lock (_syncObject)
            {
                Directory.CreateDirectory(_rootDirectory);
                var filePath = GetFilePath(folder, resourceId);
                using (var fileStream = File.OpenWrite(filePath))
                {
                    writer(fileStream);
                    fileStream.Flush();
                    fileStream.Close();
                }
            }
        }

        public void Read(string folder, Guid resourceId, Action<Stream> reader)
        {
            lock (_syncObject)
            {
                using (var stream = File.OpenRead(GetFilePath(folder, resourceId)))
                {
                    reader(stream);
                    stream.Close();
                }
            }
        }

        private string GetFilePath(string folder, Guid resourceId)
        {
            var dir = Path.Combine(_rootDirectory, folder);
            Directory.CreateDirectory(dir);
            var filePath = Path.Combine(dir, resourceId + ".xn");
            return filePath;
        }

        public IEnumerable<Guid> List(string folder)
        {
            var dir = Path.Combine(_rootDirectory, folder);
            return
                Directory.GetFiles(dir, "*.xn")
                    .Select(fileName => new FileInfo(fileName))
                    .Select(file => file.Name.Substring(0, file.Name.Length - ".xn".Length))
                    .Select(Guid.Parse);
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