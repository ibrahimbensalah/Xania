using System.Configuration;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Dependencies;
using System.Web.Routing;
using Xania.DataAccess;
using Xania.IoC;
using Xania.IoC.Resolvers;
using Xania.Web.Controllers;

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

            GlobalConfiguration.Configuration.DependencyResolver = new XaniaDependencyResolver
            {
                new ConventionBasedResolver(typeof (WebApiApplication).Assembly),
                new IdentityResolver().For<ApiController>(),
                new RegistryResolver()
                    .Register(new XaniaConfiguration
                    {
                        UploadDir = GetUploadDir()
                    })
                    .Register(new DiskStreamRepository(GetUploadDir()))
                    .Register(typeof (RepositoryBase<>))
                    .Register<FileRepository>()
            };
        }

        private static string GetUploadDir()
        {
            return 
                ConfigurationManager.AppSettings["xn:upload_dir"] ??
                HostingEnvironment.MapPath("~/App_Data");
        }

        private void ConfigureMvc()
        {
            RouteConfig.RegisterRoutes(RouteTable.Routes);
        }
    }

    public class MyDbContext
    {
    }

    partial class XaniaDependencyResolver : IDependencyResolver
    {
        public IDependencyScope BeginScope()
        {
            return this;
        }

        public void Dispose()
        {
        }
    }

}
