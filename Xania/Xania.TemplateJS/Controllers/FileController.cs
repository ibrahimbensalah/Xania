using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;

namespace Xania.TemplateJS.Controllers
{
    [Route("data/file")]
    public class FileController : Controller
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
        public async Task<CreatedResult> UploadTask(string folder, ICollection<IFormFile> files)
        {
            var resources = new List<string>();
            foreach (var file in files)
            {
                var resourceId = Guid.NewGuid().ToString();
                resources.Add(resourceId);
                await _fileRepository.AddAsync(new UploadFile(folder, resourceId, file));
            }

            return Created(Url.Content("~/data/file"), resources);
        }

        [HttpGet]
        [Route("{*resourcePath}")]
        public HttpResponseMessage Get(string resourcePath)
        {
            var file = _fileRepository.Get(resourcePath);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new HttpFileContent(file)
            };
        }

        [HttpGet]
        [Route("{*folder}")]
        public OkObjectResult List(string folder)
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

    public class UploadFile : IFile
    {
        private readonly IFormFile _file;

        public UploadFile(string folder, string resourceId, IFormFile file)
        {
            _file = file;
            Folder = folder;
            ResourceId = resourceId;
        }

        public string Name => _file.Name;

        public string ContentType => _file.ContentType;
        public string ResourceId { get; }
        public string Folder { get; }
        public Task CopyToAsync(Stream output)
        {
            return _file.CopyToAsync(output);
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
