using System;
using System.Net;
using System.Web;
using System.Web.Http;
using Xania.DataAccess;

namespace Xania.Ledger.WebApi.Controllers
{
    public class FileController: ApiController
    {
        private readonly IFileRepository _fileRepository;

        public FileController(IFileRepository fileRepository)
        {
            _fileRepository = fileRepository;
        }

        public IHttpActionResult Ping()
        {
            return Ok("pong");
        }

        public IHttpActionResult AddFile(HttpPostedFile file)
        {
            var resourceId = Guid.NewGuid();
            _fileRepository.Add(new GenericFile(file.InputStream)
            {
                ContentType = file.ContentType,
                Name = file.FileName,
                ResourceId = resourceId
            });
            return Created(Url.Content("~/file/" + resourceId), string.Empty);
        }
    }
}