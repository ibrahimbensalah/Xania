using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Xania.Graphs.EntityFramework.Tests.Relational
{
    public class GraphDbContext : DbContext
    {
        private readonly ILoggerFactory _loggerFactory;

        public GraphDbContext(ILoggerFactory loggerFactory)
        {
            _loggerFactory = loggerFactory;
        }

        public DbSet<Vertex> Vertices { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Primitive> Primitives { get; set; }
        public DbSet<Item> Items { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder
                .UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=GraphDb;Trusted_Connection=True;")
                .UseLoggerFactory(_loggerFactory)
                ;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // modelBuilder.Entity<Vertex>().HasMany(e=>e.)
            modelBuilder.Entity<Property>()
                .HasKey(e => new { e.ObjectId, e.Name });
        }
    }
}