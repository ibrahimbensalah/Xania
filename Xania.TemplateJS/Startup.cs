using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Documents.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Xania.Data.DocumentDB;
using Xania.DataAccess;
using Xania.Models;
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
                    .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                // For more details on using the user secret store see https://go.microsoft.com/fwlink/?LinkID=532709
                builder.AddUserSecrets<Startup>();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit http://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            if (Configuration.GetChildren().Any(e => e.Key.Equals("Authentication")))
            {
                services.AddAuthentication(sharedOptions =>
                    {
                        sharedOptions.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                        sharedOptions.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
                    })
                    .AddAzureAd(options => Configuration.Bind("Authentication:Microsoft", options))
                    .AddCookie();

                services.AddMvc(options => options.Filters.Add(new RequireHttpsAttribute()));
            }
            else
            {
                services.AddMvc();
            }

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
                    Id = "1".ToGuid(),
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
                    Id = "2".ToGuid(),
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
                    Id = "3".ToGuid(),
                    Name = "Darwin Recruitement"
                }
            });


            var endpointUrl = "https://xania-sql.documents.azure.com:443/";
            var primaryKey =  Configuration["xaniadb-primarykey"];

            services.AddSingleton(new DocumentClient(new Uri(endpointUrl), primaryKey, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            }));
            services.AddTransient<IObjectStore<Invoice>, AzureObjectStore<Invoice>>();

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

            app.UseAuthentication();

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
    }

    public class DevelopmentAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;

        public DevelopmentAuthenticationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            var request = context.Request;
            var contentType = request.ContentType;
            if (request.Method.Equals("POST", StringComparison.OrdinalIgnoreCase) && contentType != null)
            {
                var userName = request.Form["userName"];
                var returnUrl = request.Query["ReturnUrl"];

                if (!string.IsNullOrEmpty(userName))
                {
                    var identity =
                        new GenericIdentity(userName,
                            CookieAuthenticationDefaults
                                .AuthenticationScheme); // new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    await context.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(identity));

                    context.Response.Redirect(returnUrl);
                    return;
                }
            }
            await _next.Invoke(context);
        }
    }
}
