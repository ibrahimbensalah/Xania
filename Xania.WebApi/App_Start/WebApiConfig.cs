using System.Configuration;
using System.Web.Hosting;
using System.Web.Http;
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

            var resolver = new XaniaDependencyResolver
            {
                new ConventionBasedResolver(typeof(WebApiApplication).Assembly),
                new IdentityResolver().For<ApiController>(),
                new RegistryResolver()
                    .Register(new XaniaConfiguration
                    {
                        UploadDir = GetUploadDir()
                    })
                    .Register(new DiskDocumentStore(GetUploadDir()))
                    // .Register(typeof(BsonObjectStore<>), new ConstructorArgs(null, "bson"))
                    .Register<FileRepository>()
            };

            GlobalConfiguration.Configuration.DependencyResolver = resolver;
        }
        private static string GetUploadDir()
        {
            return
                ConfigurationManager.AppSettings["xn:upload_dir"] ??
                HostingEnvironment.MapPath("~/App_Data");
        }
    }
}
