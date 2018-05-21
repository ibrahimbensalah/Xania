using System;
using Microsoft.EntityFrameworkCore;
using Xania.Graphs.Structure;
using Xunit;

namespace Xania.Graphs.EntityFramework.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {
            using (var db = new GraphDbContext())
            {
                var result = db.Vertices.CountAsync().Result;
            }
        }
    }

    public class GraphDbContext : DbContext
    {
        public DbSet<Vertex> Vertices { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=GraphDb;Trusted_Connection=True;");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Property>().HasKey(p => p.Name);
        }
    }
}
