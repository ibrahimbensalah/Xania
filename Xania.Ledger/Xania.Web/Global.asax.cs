using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Http.Dependencies;
using System.Web.Routing;
using Xania.DataAccess;
using Xania.IoC;
using Xania.IoC.Resolvers;

namespace Xania.Ledger.WebApi
{
    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);

            var uploadDir =
                ConfigurationManager.AppSettings["xn:upload_dir"] ??
                AppDomain.CurrentDomain.BaseDirectory + VirtualPathUtility.ToAbsolute("~/App_Data");

            GlobalConfiguration.Configuration.DependencyResolver = new XaniaDependencyResolver
            {
                new ConventionBasedResolver(typeof(WebApiApplication).Assembly),
                new IdentityResolver().For<ApiController>(),
                new RegistryResolver()
                    .Register(new DiskStreamRepository(uploadDir))
                    .Register(typeof(RepositoryBase<>))
                    .Register<FileRepository>()
            };
        }
    }

    public class MyDbContext
    {
    }

    partial class XaniaDependencyResolver: IDependencyResolver
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
