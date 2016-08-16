using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;

namespace Xania.DataAccess
{
    public interface IFileRepository
    {
        void Add(IFile file);
        IFile Get(string resourceId);
        IEnumerable<IFile> List(string folder);
    }

    public interface IFile
    {
        string Name { get; }
        string ContentType { get; }
        string ResourceId { get; }
        string Folder { get; }
        void CopyTo(Stream output);
    }

    public abstract class FileBase : IFile
    {
        public string Name { get; set; }
        public string ContentType { get; set; }
        public string ResourceId { get; set; }
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

    public class Document: FileBase
    {
        private readonly IDocumentStore _documentStore;

        public Document(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
        }

        public override void CopyTo(Stream output)
        {
            _documentStore.Read(Folder, ResourceId, s => s.CopyTo(output));
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
        private readonly IObjectStore<FileMetadata> _metadataRepository;
        private readonly IDocumentStore _documentStore;

        public FileRepository(IObjectStore<FileMetadata> metadataRepository,
            IDocumentStore documentStore)
        {
            _metadataRepository = metadataRepository;
            _documentStore = documentStore;
        }

        public void Add(IFile file)
        {
            var metadata = FileMetadata.FromFile(file);
            _documentStore.Add(file.Folder, metadata.ResourceId, file.CopyTo);
            _metadataRepository.Add(metadata);
        }

        public IFile Get(string resourceId)
        {
            var qu =
                from f in _metadataRepository
                where f.ResourceId == resourceId
                select f;

            var metadata = qu.FirstOrDefault();
            if (metadata == null)
                return null;

            return new Document(_documentStore)
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
                from resourceId in _documentStore.List(folder)
                from metadata in _metadataRepository
                where metadata.ResourceId == resourceId
                select new Document(_documentStore)
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
        [Key]
        public string ResourceId { get; set; }
        public string Name { get; set; }
        public string ContentType { get; set; }
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