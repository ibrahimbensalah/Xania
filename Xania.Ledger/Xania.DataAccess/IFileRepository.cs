using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public interface IFileRepository
    {
        void Add(IFile file);
        IFile Get(Guid resourceId);
    }

    public interface IFile
    {
        string Name { get; }
        string ContentType { get; }
        Guid ResourceId { get; }
        void Read(Action<Stream> reader);
    }

    public class GenericFile : IFile
    {
        private readonly Func<Stream> _streamFunc;

        public GenericFile(Stream stream)
            : this(() => stream)
        {
        }

        public GenericFile(Func<Stream> streamFunc)
        {
            _streamFunc = streamFunc;
        }

        public string Name { get; set; }
        public string ContentType { get; set; }
        public Guid ResourceId { get; set; }

        public void Read(Action<Stream> reader)
        {
            using (var stream = _streamFunc())
            {
                reader(stream);
                stream.Close();
            }
        }
    }

    public class FileRepository : IFileRepository
    {
        private readonly IRepository<FileMetadata> _metadataRepository;
        private readonly IStreamRepository _streamRepository;

        public FileRepository(IRepository<FileMetadata> metadataRepository, IStreamRepository streamRepository)
        {
            _metadataRepository = metadataRepository;
            _streamRepository = streamRepository;
        }

        public void Add(IFile file)
        {
            var metadata = FileMetadata.FromFile(file);
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

            return metadata.ToFile(() => _streamRepository.Get(metadata.ResourceId));
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

        public IFile ToFile(Func<Stream> stream)
        {
            return new GenericFile(stream)
            {
                ResourceId = ResourceId,
                Name = Name,
                ContentType = ContentType
            };
        }
    }

}
