using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Dependencies;
using Xania.DataAccess;
using Xania.IoC;
using Xania.IoC.Resolvers;
using Xania.WebApi.Controllers;

namespace Xania.WebApi
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

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
                    .Register(typeof (TransientRepository<>))
                    .Register<FileRepository>()
            };
        }
        private static string GetUploadDir()
        {
            return
                ConfigurationManager.AppSettings["xn:upload_dir"] ??
                HostingEnvironment.MapPath("~/App_Data");
        }
    }
}
