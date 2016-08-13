using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Xania.DataAccess
{
    public interface IFileRepository
    {
        void Add(IFile file);
        IFile Get(Guid resourceId);
        IEnumerable<IFile> List(string folder);
    }

    public interface IFile
    {
        string Name { get; }
        string ContentType { get; }
        Guid ResourceId { get; }
        string Folder { get; }
        void CopyTo(Stream output);
    }

    public abstract class FileBase : IFile
    {
        public string Name { get; set; }
        public string ContentType { get; set; }
        public Guid ResourceId { get; set; }
        public string Folder { get; set; }
        public abstract void CopyTo(Stream output);
    }

    public interface IOutputStream
    {
        string Name { get; }
        string ContentType { get; }
        Guid ResourceId { get; }
        void Read(Action<Stream> reader);
    }

    public class RepositoryFile: FileBase
    {
        private readonly IStreamRepository _streamRepository;

        public RepositoryFile(IStreamRepository streamRepository)
        {
            _streamRepository = streamRepository;
        }

        public override void CopyTo(Stream output)
        {
            _streamRepository.Read(Folder, ResourceId, s => s.CopyTo(output));
        }
    }

    public class DiskFile : FileBase
    {
        private readonly string _filePath;

        public DiskFile(string filePath)
        {
            _filePath = filePath;
        }

        public override void CopyTo(Stream output)
        {
            using (var stream = File.OpenRead(_filePath))
            {
                stream.CopyTo(output);
                output.Flush();
                stream.Close();
            }
        }
    }

    public class FileRepository : IFileRepository
    {
        private readonly IRepository<FileMetadata> _metadataRepository;
        private readonly IStreamRepository _streamRepository;

        public FileRepository(IRepository<FileMetadata> metadataRepository,
            IStreamRepository streamRepository)
        {
            _metadataRepository = metadataRepository;
            _streamRepository = streamRepository;
        }

        public void Add(IFile file)
        {
            var metadata = FileMetadata.FromFile(file);
            _streamRepository.Add(file.Folder, metadata.ResourceId, file.CopyTo);
            _metadataRepository.Add(metadata);
        }

        public IFile Get(Guid resourceId)
        {
            var qu =
                from f in _metadataRepository
                where f.ResourceId == resourceId
                select f;

            var metadata = qu.FirstOrDefault();
            if (metadata == null)
                return null;

            return new RepositoryFile(_streamRepository)
            {
                ResourceId = metadata.ResourceId,
                Name = metadata.Name,
                ContentType = metadata.ContentType,
                Folder = metadata.Folder
            };
        }

        public IEnumerable<IFile> List(string folder)
        {
            return
                from resourceId in _streamRepository.List(folder)
                from metadata in _metadataRepository
                where metadata.ResourceId == resourceId
                select new RepositoryFile(_streamRepository)
                {
                    ResourceId = metadata.ResourceId,
                    Name = metadata.Name,
                    ContentType = metadata.ContentType,
                    Folder = metadata.Folder
                };
        }
    }

    public class FileMetadata
    {
        public string Name { get; set; }
        public string ContentType { get; set; }
        public Guid ResourceId { get; set; }
        public string Folder { get; set; }

        public static FileMetadata FromFile(IFile file)
        {
            return new FileMetadata
            {
                Name = file.Name,
                ContentType = file.ContentType,
                ResourceId = file.ResourceId,
                Folder = file.Folder
            };
        }
    }

}