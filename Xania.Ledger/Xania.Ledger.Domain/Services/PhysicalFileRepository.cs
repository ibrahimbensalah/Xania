using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xania.Ledger.Domain.Models;

namespace Xania.Ledger.Domain.Services
{
    public class PhysicalFileRepository : IStreamRepository
    {
        private readonly string _directoryPath;
        private static object _syncObject = new object();

        public PhysicalFileRepository(string directoryPath)
        {
            _directoryPath = directoryPath;

            Directory.CreateDirectory(_directoryPath);
        }

        public void Add(Guid resourceId, Stream contentStream)
        {
            lock (_syncObject)
            {
                var filePath = GetFilePath(resourceId);
                using (var fileStream = File.OpenWrite(filePath))
                {
                    contentStream.CopyTo(fileStream);
                    fileStream.Close();
                }
            }
        }

        public Stream Get(Guid resourceId)
        {
            lock (_syncObject)
            {
                return File.OpenRead(GetFilePath(resourceId));
            }
        }

        private string GetFilePath(Guid resourceId)
        {
            var filePath = Path.Combine(_directoryPath, resourceId + ".xn");
            return filePath;
        }

        public IEnumerable<Guid> List()
        {
            return
                Directory.GetFiles(_directoryPath, "*.xn")
                    .Select(fileName=> new FileInfo(fileName))
                    .Select(file => file.Name.Substring(0, file.Name.Length - ".xn".Length))
                    .Select(Guid.Parse);
        }
    }

    public static class StreamServiceExtensions
    {
        public static Guid Add(this IStreamRepository streamRepository, Stream stream)
        {
            var resourceId = Guid.NewGuid();
            streamRepository.Add(resourceId, stream);
            return resourceId;
        }
    }

    public interface IStreamRepository
    {
        void Add(Guid resourceId, Stream contentStream);
    }
}
