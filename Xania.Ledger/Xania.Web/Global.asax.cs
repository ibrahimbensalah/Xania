using System.Configuration;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Dependencies;
using System.Web.Routing;

namespace Xania.Web
{
    public class WebApiApplication : HttpApplication
    {
        protected void Application_Start()
        {
            ConfigureWebApi();
            ConfigureMvc();
        }

        private static void ConfigureWebApi()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);
        }

        private void ConfigureMvc()
        {
            RouteConfig.RegisterRoutes(RouteTable.Routes);
        }
    }
}
