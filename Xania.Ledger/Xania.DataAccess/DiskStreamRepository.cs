using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using DiskFile = System.IO.File;

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

        public void Add(Guid resourceId, Stream contentStream)
        {
            lock (_syncObject)
            {
                Directory.CreateDirectory(_rootDirectory);
                var filePath = GetFilePath(resourceId);
                using (var fileStream = System.IO.File.OpenWrite(filePath))
                {
                    contentStream.CopyTo(fileStream);
                    fileStream.Flush();
                    fileStream.Close();
                }
            }
        }

        public Stream Get(Guid resourceId)
        {
            lock (_syncObject)
            {
                return DiskFile.OpenRead(GetFilePath(resourceId));
            }
        }

        private string GetFilePath(Guid resourceId)
        {
            var filePath = Path.Combine(_rootDirectory, resourceId + ".xn");
            return filePath;
        }

        public IEnumerable<Guid> List()
        {
            return
                Directory.GetFiles(_rootDirectory, "*.xn")
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