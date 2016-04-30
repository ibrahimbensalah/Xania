using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Xania.DataAccess;

namespace Xania.Ledger.WebApi.Controllers
{
    public class FileController : ApiController
    {
        private readonly IFileRepository _fileRepository;

        public FileController(IFileRepository fileRepository)
        {
            _fileRepository = fileRepository;
        }

        [HttpGet]
        public IHttpActionResult Ping()
        {
            return Ok("pong");
        }

        public async Task<HttpResponseMessage> Add()
        {
            if (!Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            
            string rootPath = Url.Content("~/App_Data");
            var provider = new MultipartFormDataStreamProvider(rootPath);

            await Request.Content.ReadAsMultipartAsync(provider);

            foreach (MultipartFileData file in provider.FileData)
            {
                _fileRepository.Add("uploads", new DiskFile(file.LocalFileName)
                {
                    ContentType = file.Headers.ContentType.MediaType,
                    Name = file.Headers.ContentDisposition.FileName,
                    ResourceId = Guid.NewGuid()
                });
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}