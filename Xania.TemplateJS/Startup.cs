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
using Xania.CosmosDb;
using Xania.Data.DocumentDB;
using Xania.DataAccess;
using Xania.Graphs;
using Xania.Graphs.Linq;
using Xania.Invoice.Domain;
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

            var endpointUrl = Configuration["xaniadb-endpointUrl"];
            var primaryKey =  Configuration["xaniadb-primarykey"];

            var dataContext  = new XaniaDataContext(endpointUrl, primaryKey);
            services.AddSingleton(dataContext);

            var cosmosDbClient = new CosmosDb.CosmosDbClient(
                "https://localhost:8081/",
                "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
                "ToDoList",
                "Portal"
            );

            var companyStore = new AzureGraphStore<Company>(cosmosDbClient);
            foreach (var company in dataContext.Store<Company>())
            {
                companyStore.Add(company);
            }

            services.AddTransient<IObjectStore<Invoice.Domain.Invoice>>(ctx => dataContext.Store<Invoice.Domain.Invoice>());
            services.AddTransient<IObjectStore<Company>>(ctx => companyStore);
            services.AddTransient<IObjectStore<TimeDeclaration>>(ctx => dataContext.Store<TimeDeclaration>());
            services.AddTransient<IObjectStore<TimeSheet>>(ctx => dataContext.Store<TimeSheet>());

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
