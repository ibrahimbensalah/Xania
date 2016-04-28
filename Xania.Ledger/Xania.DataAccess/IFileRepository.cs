using System;
using System.IO;
using System.Linq;

namespace Xania.DataAccess
{
    public interface IFileRepository
    {
        void Add(string folder, IFile file);
        IFile Get(string folder, Guid resourceId);
    }

    public interface IFile
    {
        string Name { get; }
        string ContentType { get; }
        Guid ResourceId { get; }
        void CopyTo(Stream output);
    }

    public interface IOutputStream
    {
        string Name { get; }
        string ContentType { get; }
        Guid ResourceId { get; }
        void Read(Action<Stream> reader);
    }

    public class RepositoryFile: IFile
    {
        private readonly IStreamRepository _streamRepository;
        private readonly string _folder;

        public RepositoryFile(IStreamRepository streamRepository, string folder)
        {
            _streamRepository = streamRepository;
            _folder = folder;
        }

        public string Name { get; set; }
        public string ContentType { get; set; }
        public Guid ResourceId { get; set; }
        public void CopyTo(Stream output)
        {
            _streamRepository.Read(_folder, ResourceId, s => s.CopyTo(output));
        }
    }

    public class DiskFile : IFile
    {
        private readonly string _filePath;

        public DiskFile(string filePath)
        {
            _filePath = filePath;
        }

        public string Name { get; set; }
        public string ContentType { get; set; }
        public Guid ResourceId { get; set; }

        public void CopyTo(Stream output)
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

        public void Add(string folder, IFile file)
        {
            var metadata = FileMetadata.FromFile(file);
            _streamRepository.Add(folder, metadata.ResourceId, file.CopyTo);
        }

        public IFile Get(string folder, Guid resourceId)
        {
            var qu =
                from f in _metadataRepository
                where f.ResourceId == resourceId
                select f;

            var metadata = qu.FirstOrDefault();
            if (metadata == null)
                return null;

            return new RepositoryFile(_streamRepository, folder)
            {
                ResourceId = metadata.ResourceId,
                Name = metadata.Name,
                ContentType = metadata.ContentType
            };
        }

    }

    public class FileMetadata
    {
        public string Name { get; set; }
        public string ContentType { get; set; }
        public Guid ResourceId { get; set; }

        public static FileMetadata FromFile(IFile file)
        {
            return new FileMetadata
            {
                Name = file.Name,
                ContentType = file.ContentType,
                ResourceId = file.ResourceId
            };
        }
    }

}