using Microsoft.AspNetCore.Mvc;

namespace Xania.TemplateJS.Controllers
{
    public class TestController: Controller
    {
        [Route("test")]
        public IActionResult Index()
        {
            return View();
        }
    }
}
