using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;

namespace WebApplication1
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit http://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.Use(async (context, next) =>
            {
                if (!context.Request.Path.Value.EndsWith(".js"))
                {
                    var result = GetClientApp(context.Request.Path.Value, "wwwroot");
                    if (result != null)
                    {
                        var fileContent = File.ReadAllText("boot.html")
                            .Replace("[APP]", result.Name)
                            .Replace("[BASE]", result.Base)
                            .Replace("[ARGS]", result.Args);


                        context.Response.ContentType = "text/html";
                        await context.Response.WriteAsync(fileContent);

                        return;
                    }
                }

                await next.Invoke();
            });

            app.Run(async (context) =>
            {
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("NOT FOUND");
            });
        }

        private AppResult GetClientApp(string pathValue, string baseDirectory)
        {
            var parts = pathValue.Split(new [] {'/'}, StringSplitOptions.RemoveEmptyEntries);
            string basePath = "/";
            for (var i = 0; i < parts.Length; i++)
            {
                var part = parts[i];
                var app = basePath + part;

                var jsExists = File.Exists(baseDirectory + "/" + app + ".js");
                var dirExists = Directory.Exists(baseDirectory + "/" + app);

                if (jsExists && dirExists)
                    throw new InvalidOperationException("jsExists && dirExists");

                if (jsExists)
                {
                    return new AppResult
                    {
                        Base = basePath ?? "",
                        Name = part,
                        Args = string.Join("/", parts.Skip(i + 1))
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
        public string Name { get; set; }
        public string Args { get; set; }
        public string Base { get; set; }
    }
}
