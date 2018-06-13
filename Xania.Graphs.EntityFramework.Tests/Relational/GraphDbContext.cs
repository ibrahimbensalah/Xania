using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;
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
        public DbSet<Edge> Edges { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Primitive> Primitives { get; set; }
        public DbSet<Item> Items { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder
                .UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=GraphDb;Trusted_Connection=True;Integrated Security=True")
                .UseLoggerFactory(_loggerFactory)
                ;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Property>()
                .HasKey(e => new { e.ObjectId, e.Name });

            modelBuilder.Entity<Item>()
                .HasKey(e => new { e.ListId, e.ItemId });

            TrackLastUpdate<Vertex>(modelBuilder);
            TrackLastUpdate<Property>(modelBuilder);
            TrackLastUpdate<Primitive>(modelBuilder);
            TrackLastUpdate<Item>(modelBuilder);
            TrackLastUpdate<Edge>(modelBuilder);
        }

        private void TrackLastUpdate<T>(ModelBuilder modelBuilder) where T : class
        {
            modelBuilder.Entity<T>()
                .Property<DateTimeOffset>("LastUpdated")
                .HasValueGenerator(typeof(CurrentTimeGenerator))
                ;
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            ChangeTracker.DetectChanges();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }
    }

    public class CurrentTimeGenerator: ValueGenerator<DateTimeOffset>
    {
        public override DateTimeOffset Next(EntityEntry entry)
        {
            return DateTimeOffset.UtcNow;
        }

        public override bool GeneratesTemporaryValues { get; } = false;
    }
}