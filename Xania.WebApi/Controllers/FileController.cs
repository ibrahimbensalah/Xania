using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web.Http;
using Xania.DataAccess;

namespace Xania.WebApi.Controllers
{
    [RoutePrefix("data/file")]
    public class FileController : ApiController
    {
        private readonly IFileRepository _fileRepository;
        private readonly IXaniaConfiguration _configuration;

        public FileController(IFileRepository fileRepository, IXaniaConfiguration configuration)
        {
            _fileRepository = fileRepository;
            _configuration = configuration;
        }

        [HttpPost]
        [Route("{*folder}")]
        public async Task<IHttpActionResult> UploadTask(string folder)
        {
            if (!Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            
            var provider = new MultipartFormDataStreamProvider(_configuration.UploadDir);

            await Request.Content.ReadAsMultipartAsync(provider);

            var resources = new List<string>();
            foreach (var file in provider.FileData)
            {
                var resourceId = Guid.NewGuid().ToString();
                resources.Add(resourceId);
                await _fileRepository.AddAsync(new DiskFile(file.LocalFileName)
                {
                    Folder = folder,
                    ContentType = file.Headers.ContentType.MediaType,
                    Name = file.Headers.ContentDisposition.FileName,
                    ResourceId = resourceId
                });
                File.Delete(file.LocalFileName);
            }

            return Created(Url.Content("~/data/file"), resources);
        }

        [HttpGet]
        [Route("{*resourcePath}")]
        public HttpResponseMessage  Get(string resourcePath)
        {
            var file = _fileRepository.Get(resourcePath);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new HttpFileContent(file)
            };
        }

        [HttpGet]
        [Route("{*folder}")]
        public IHttpActionResult List(string folder)
        {
            var files =
                from file in _fileRepository.List(folder)
                select new FileViewModel
                {
                    ResourceId = file.ResourceId,
                    Name = file.Name,
                    Url = Url.Content("~/data/file/download/" + file.ResourceId.ToString())
                };
            return Ok(files);
        }
    }

    public class HttpFileContent : HttpContent
    {
        private readonly IFile _file;

        public HttpFileContent(IFile file)
        {
            _file = file;
            Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        }

        protected override Task SerializeToStreamAsync(Stream stream, TransportContext context)
        {
            return _file.CopyToAsync(stream);
        }

        protected override bool TryComputeLength(out long length)
        {
            length = 0;
            return false;
        }
    }
    public class FileViewModel
    {
        public string ResourceId { get; set; }
        public string Url { get; set; }
        public string Name { get; set; }
    }

    public class XaniaConfiguration : IXaniaConfiguration
    {
        public string UploadDir { get; set; }
    }

    public interface IXaniaConfiguration
    {
        string UploadDir { get; }
    }
}