using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Xania.TemplateJS.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [AllowAnonymous]
        public IActionResult Error()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Login()
        {
            var model = ClientResult.GetClientApp("home/login", "wwwroot");
            return View("Boot", model);
        }


        [Authorize]
        public IActionResult Boot(string appPath)
        {
            var model = ClientResult.GetClientApp(appPath ?? "admin/app", "wwwroot");
            if (model == null)
                return new BadRequestObjectResult("Could not resolve client application: " + appPath);

            return View(model);
        }
    }

    public class ClientResult
    {
        public string Base { get; set; }
        public string Name { get; set; }
        public IEnumerable<string> Args { get; set; }


        public static ClientResult GetClientApp(string pathValue, string baseDirectory)
        {
            var parts = pathValue.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            string basePath = "/";
            for (var i = 0; i < parts.Length; i++)
            {
                var part = parts[i];
                var app = basePath + part;

                var jsExists = System.IO.File.Exists(baseDirectory + "/" + app + ".js");
                var dirExists = Directory.Exists(baseDirectory + "/" + app);

                if (jsExists && dirExists)
                    throw new InvalidOperationException("jsExists && dirExists");

                if (jsExists)
                {
                    var args = parts.Skip(i + 1);
                    return new ClientResult
                    {
                        Base = basePath ?? "",
                        Name = part,
                        Args = args
                    };
                }

                if (!dirExists)
                {
                    return null;
                }

                basePath = app + "/";
            }
            return null;
        }
    }
}
