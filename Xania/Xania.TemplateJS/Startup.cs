using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xania.DataAccess;
using Xania.TemplateJS.Controllers;
using Xania.TemplateJS.Reporting;

namespace Xania.TemplateJS
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();
        }
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit http://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
            services.AddSingleton<IObjectStore<User>>(new TransientObjectStore<User>());
            services.AddSingleton<IObjectStore<Company>>(new TransientObjectStore<Company>
            {
                new Company
                {
                    Address = new Address
                    {
                        FullName = "Ibrahim ben Salah", Location = "Amsterdam",
                        Lines =
                        {
                            new AddressLine { Type = AddressType.Street, Value = "Punter 315 "}
                        }
                    },
                    Id = 1,
                    Name = "Xania Software"
                },
                new Company
                {
                    Address = new Address
                    {
                        FullName = "Edi Gittenberger", Location = "Amsterdam",
                        Lines =
                        {
                            new AddressLine { Type = AddressType.Street, Value = "Sijsjesbergweg 42"},
                            new AddressLine { Type = AddressType.ZipCode, Value = "1105 AL"}
                        }
                    },
                    Id = 2,
                    Name = "Rider International BV"
                },
                new Company
                {
                    Address = new Address
                    {
                        FullName = "Jan Piet", Location = "Amsterdam",
                        Lines =
                        {
                            new AddressLine { Type = AddressType.Street, Value = "WTC 123"}
                        }
                    },
                    Id = 3,
                    Name = "Darwin Recruitement"
                }
            });

            services.AddSingleton<IObjectStore<Invoice>>(new TransientObjectStore<Invoice>
            {
                new Invoice {Id = "invoice 1".ToGuid(), Description = "invoice 1", InvoiceNumber = "201701", CompanyId = 1 },
                new Invoice {Id = "invoice 2".ToGuid(), Description = "invoice 2", InvoiceNumber = "201702", CompanyId = 2, InvoiceDate = DateTime.Now},
                new Invoice {Id = "invoice 3".ToGuid(), Description = "invoice 3", InvoiceNumber = "201703", CompanyId = 3, InvoiceDate = DateTime.Now}
            });

            services.AddOptions();
            services.Configure<XaniaConfiguration>(Configuration);
        }
        public IConfigurationRoot Configuration { get; }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddConsole();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseStaticFiles();
            app.UseStaticFiles(new StaticFileOptions
            {
                ServeUnknownFileTypes = true,
                DefaultContentType = "text/css"
            });

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");

                routes.MapRoute(
                    name: "boot",
                    template: @"{*appPath}",
                    defaults: new { controller = "Home", action = "Boot" }
                    );
            });

            app.Run(async (context) =>
            {
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("NOT FOUND");
            });
        }

        private AppResult GetClientApp(string pathValue, string baseDirectory)
        {
            var parts = pathValue.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            string basePath = "/";
            string bootFile = baseDirectory + "/boot.html";
            for (var i = 0; i < parts.Length; i++)
            {
                var part = parts[i];
                var app = basePath + part;

                var jsExists = File.Exists(baseDirectory + "/" + app + ".js");
                var dirExists = Directory.Exists(baseDirectory + "/" + app);

                if (jsExists && dirExists)
                    throw new InvalidOperationException("jsExists && dirExists");

                if (File.Exists(baseDirectory + basePath + "boot.html"))
                    bootFile = baseDirectory + basePath + "boot.html";

                if (jsExists)
                {
                    return new AppResult
                    {
                        Content = File.ReadAllText(bootFile),
                        Base = basePath ?? "",
                        Name = part,
                        Args = string.Join("", parts.Skip(i + 1).Select(x => "/" + x))
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

    public class ActionRoute : RouteBase
    {
        protected override Task OnRouteMatched(RouteContext context)
        {
            throw new NotImplementedException();
        }

        protected override VirtualPathData OnVirtualPathGenerated(VirtualPathContext context)
        {
            throw new NotImplementedException();
        }

        public ActionRoute(string template, string name, IInlineConstraintResolver constraintResolver, RouteValueDictionary defaults, IDictionary<string, object> constraints, RouteValueDictionary dataTokens) 
            : base(template, name, constraintResolver, defaults, constraints, dataTokens)
        {
        }
    }

    internal class AppResult
    {
        public string Content { get; set; }
        public string Name { get; set; }
        public string Args { get; set; }
        public string Base { get; set; }
    }
}
