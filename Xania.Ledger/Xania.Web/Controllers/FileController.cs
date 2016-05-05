using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Xania.DataAccess;

namespace Xania.Web.Controllers
{
    public class FileController : ApiController
    {
        private readonly IFileRepository _fileRepository;
        private readonly IXaniaConfiguration _configuration;

        public FileController(IFileRepository fileRepository, IXaniaConfiguration configuration)
        {
            _fileRepository = fileRepository;
            _configuration = configuration;
        }

        [HttpGet]
        public IHttpActionResult Ping()
        {
            return Ok(_configuration.UploadDir);
        }

        public async Task<HttpResponseMessage> Add()
        {
            if (!Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            
            var provider = new MultipartFormDataStreamProvider(_configuration.UploadDir);

            await Request.Content.ReadAsMultipartAsync(provider);

            var resources = new List<Guid>();
            foreach (MultipartFileData file in provider.FileData)
            {
                var resourceId = Guid.NewGuid();
                resources.Add(resourceId);
                _fileRepository.Add("uploads", new DiskFile(file.LocalFileName)
                {
                    ContentType = file.Headers.ContentType.MediaType,
                    Name = file.Headers.ContentDisposition.FileName,
                    ResourceId = resourceId
                });
                File.Delete(file.LocalFileName);
            }

            return Request.CreateResponse(HttpStatusCode.OK, resources);
        }
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