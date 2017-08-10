using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
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
                services.AddMvc(options => options.Filters.Add(new RequireHttpsAttribute()));
                services.AddAuthentication(
                    SharedOptions => SharedOptions.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme);
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

            IObjectStore<Invoice> store = new DocumentObjectStore<Invoice>(new MemoryDocumentStore())
            {
                new Invoice
                {
                    Id = "invoice 1".ToGuid(), Description = "invoice 1", InvoiceNumber = "201701", CompanyId = 1
                },
                new Invoice
                {
                    Id = "invoice 2".ToGuid(), Description = "invoice 2", InvoiceNumber = "201702", CompanyId = 2, InvoiceDate = DateTime.Now
                },
                new Invoice
                {
                    Id = "invoice 3".ToGuid(), Description = "invoice 3", InvoiceNumber = "201703", CompanyId = 3, InvoiceDate = DateTime.Now
                }
            };
            services.AddSingleton<IObjectStore<Invoice>>(store);

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

            if (Configuration.GetChildren().Any(e => e.Key.Equals("Authentication")))
            {
                app.UseCookieAuthentication();
                app.UseOpenIdConnectAuthentication(new OpenIdConnectOptions
                {
                    ClientId = Configuration["Authentication:AzureAd:ClientId"],
                    Authority = Configuration["Authentication:AzureAd:AADInstance"] +
                                Configuration["Authentication:AzureAd:TenantId"],
                    CallbackPath = Configuration["Authentication:AzureAd:CallbackPath"]
                });
            }

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
}
