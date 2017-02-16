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
                    var result = ParseRoute(context.Request.Path.Value, "wwwroot");
                    if (result != null)
                    {
                        var fileContent = File.ReadAllText("boot.html")
                            .Replace("[FILE]", result.File)
                            .Replace("[ARGS]", result.Args);


                        context.Response.ContentType = "text/html";
                        await context.Response.WriteAsync(fileContent);

                        return;
                    }
                }

                await next.Invoke();
            });

            //app.Run(async (context) =>
            //{
            //    await context.Response.WriteAsync("Hello World!");
            //});
        }

        private RouteResult ParseRoute(string pathValue, string baseDirectory)
        {
            var file = baseDirectory;
            var parts = pathValue.Split('/');
            for (var i = 0; i < parts.Length; i++)
            {
                file = Path.Combine(file, parts[i]);
                var jsExists = File.Exists(file + ".js");
                var dirExists = Directory.Exists(file);

                if (jsExists && dirExists)
                    throw new InvalidOperationException("jsExists && dirExists");

                if (jsExists)
                {
                    return new RouteResult
                    {
                        File = "'" + file + "'",
                        Args = "[" + string.Join("', '", parts.Skip(i + 1).Select(x => "'" + x + "'")) + "]"
                    };
                }
                if (!dirExists)
                {
                    return null;
                }
            }
            return null;
        }
    }

    internal class RouteResult
    {
        public string File { get; set; }
        public string Args { get; set; }

    }
}
