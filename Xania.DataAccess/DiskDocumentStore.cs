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

        public Task AddAsync(string folder, string resourceId, Action<Stream> copyTo)
        {
            lock (SyncObject)
            {
                Directory.CreateDirectory(_rootDirectory);
                var filePath = GetFilePath(folder, resourceId);
                using (var fileStream = File.OpenWrite(filePath))
                {
                    copyTo(fileStream);
                }
            }

            return Task.CompletedTask;
        }

        public IDocument Get(string folder, string resourceId)
        {
            return new DiskDocument(GetFilePath(folder, resourceId));
        }

        public Task<T> ReadAsync<T>(string folder, string resourceId, Func<Stream, T> reader)
        {
            lock (SyncObject)
            {
                using (var stream = File.OpenRead(GetFilePath(folder, resourceId)))
                {
                    return Task.FromResult(reader(stream));
                }
            }
        }

        public Task UpdateAsync(string folder, string resourceId, Action<Stream> copyTo)
        {
            return AddAsync(folder, resourceId, copyTo);
        }

        public Task DeleteAsync(string folder, string resourceId)
        {
            lock (SyncObject)
            {
                var filePath = GetFilePath(folder, resourceId);
                File.Delete(filePath);

                return Task.CompletedTask;
            }
        }

        private string GetFilePath(string folder, string resourceId)
        {
            var dir = Path.Combine(_rootDirectory, folder);
            Directory.CreateDirectory(dir);
            var filePath = Path.Combine(dir, resourceId + ".xn");
            return filePath;
        }

        public Stream OpenWrite(string folder, string resourceId)
        {
            return File.OpenWrite(GetFilePath(folder, resourceId));
        }

        public Stream OpenRead(string folder, string resourceId)
        {
            return File.OpenRead(GetFilePath(folder, resourceId));
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
    }
}