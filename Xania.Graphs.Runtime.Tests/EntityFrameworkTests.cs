using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using NUnit.Framework;

namespace Xania.Graphs.Runtime.Tests
{
    public class EntityFrameworkTests
    {
        [Test]
        public void EfToDictionaryTest()
        {
            using(var db = new WorldDbContext())
            {
                var q =
                    from p in db.People
                    select new Dictionary<string, object>
                    {
                        {"Name", p.Name},
                        {"Id", p.Id},
                    };

                var e = q.Single();
            }
        }

        public class WorldDbContext : DbContext
        {
            public WorldDbContext()
                :base(GetOptions())
            {
                
            }

            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                base.OnModelCreating(modelBuilder);
            }

            private static DbContextOptions GetOptions()
            {
                var ob = new DbContextOptionsBuilder<WorldDbContext>();
                ob.UseLoggerFactory(new LoggerFactory(new[]
                {
                    new ConsoleLoggerProvider((category, level)
                        => category == DbLoggerCategory.Database.Command.Name
                           && level == LogLevel.Information, true)
                }));
                ob.UseSqlServer("server=.;database=test;integrated security=true;", GetSqlServerOptions);
                return ob.Options;
            }

            private static void GetSqlServerOptions(SqlServerDbContextOptionsBuilder obj)
            {
            }

            public DbSet<Course> People { get; set; }
        }
    }

    public class Course
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
