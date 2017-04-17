using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Xania.DataAccess;
using Xania.TemplateJS.Controllers;

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
            services.AddSingleton<IObjectStore<Company>>(new TransientObjectStore<Company>());
            services.AddSingleton<IObjectStore<Invoice>>(new TransientObjectStore<Invoice>()
            {
                new Invoice {Description = "invoice 1", InvoiceNumber = "201701"},
                new Invoice {Description = "invoice 2", InvoiceNumber = "201702", InvoiceDate = DateTime.Now},
                new Invoice {Description = "invoice 3", InvoiceNumber = "201703", InvoiceDate = DateTime.Now}
            });
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
                    name: "boot",
                    template: "{*appPath:regex(^[a-zA-Z\\/]+$)}",
                    defaults: new { controller = "Home", action = "Boot" }
                    );

                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");

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

    internal class AppResult
    {
        public string Content { get; set; }
        public string Name { get; set; }
        public string Args { get; set; }
        public string Base { get; set; }
    }
}
