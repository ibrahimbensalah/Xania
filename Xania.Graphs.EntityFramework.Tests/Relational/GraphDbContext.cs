using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Xania.Graphs.Structure;

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
                .UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=GraphDb;Trusted_Connection=True;Integrated Security=True")
                // .UseLoggerFactory(_loggerFactory)
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
        }

        private void TrackLastUpdate<T>(ModelBuilder modelBuilder) where T : class
        {
            modelBuilder.Entity<T>()
                .Property<DateTimeOffset>("LastUpdated")
                .HasValueGenerator(typeof(CurrentTimeGenerator))
                ;
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

    public static class GraphDbContextExtensions
    {
        public static void Store(this GraphDbContext db, Graph graph)
        {
            foreach (var v in graph.Vertices)
            {
                db.Vertices.Add(new Relational.Vertex { Id = v.Id, Label = v.Label });

                var propertiesStack = new Stack<(string, IEnumerable<Structure.Property>)>();
                propertiesStack.Push((v.Id, v.Properties));

                while (propertiesStack.Count > 0)
                {
                    var (objectId, properties) = propertiesStack.Pop();
                    foreach (var p in properties)
                    {
                        var property =
                            new Relational.Property { Name = p.Name, ObjectId = objectId, ValueId = Guid.NewGuid().ToString() };
                        db.Properties.Add(property);

                        var valuesStack = new Stack<(string, GraphValue)>();
                        valuesStack.Push((property.ValueId, p.Value));

                        while (valuesStack.Count > 0)
                        {
                            var (valueId, value) = valuesStack.Pop();

                            if (value is Structure.GraphPrimitive prim)
                            {
                                db.Primitives.Add(new Relational.Primitive
                                {
                                    Id = valueId,
                                    Value = JsonConvert.SerializeObject(prim.Value)
                                });
                            }
                            else if (value is Structure.GraphObject obj)
                            {
                                propertiesStack.Push((valueId, obj.Properties));
                            }
                            else if (value is Structure.GraphList list)
                            {
                                foreach (var item in list.Items)
                                {
                                    var itemId = Guid.NewGuid().ToString();
                                    db.Items.Add(new Relational.Item { ItemId = itemId, ListId = valueId });

                                    valuesStack.Push((itemId, item));
                                }
                            }
                        }
                    }
                }
            }

            db.SaveChanges();
        }
        public static Graph LoadFull(this GraphDbContext db)
        {
            var g = new Graph();
            var values = new Dictionary<string, GraphValue>();

            foreach (var prim in db.Primitives.AsNoTracking())
                values.Add(prim.Id, new GraphPrimitive(JsonConvert.DeserializeObject(prim.Value)));

            foreach (var listId in db.Items.Select(p => p.ListId).Distinct().AsNoTracking())
                values.Add(listId, new GraphList());

            foreach (var v in db.Vertices.AsNoTracking())
            {
                var vertex = new Structure.Vertex(v.Label) { Id = v.Id };
                g.Vertices.Add(vertex);
                values.Add(v.Id, vertex);
            }

            foreach (var propertyGroup in db.Properties.GroupBy(p => p.ObjectId).AsNoTracking())
            {
                var objectId = propertyGroup.Key;
                var entry = values.TryGetValue(objectId, out var value)
                    ? value
                    : values.AddAndReturn(objectId, new Structure.GraphObject());

                if (entry is Structure.GraphObject obj)
                {
                    foreach (var property in propertyGroup)
                    {
                        var propertyValue = values.TryGetValue(property.ValueId, out var result)
                            ? result
                            : GraphValue.Null;

                        obj.Properties.Add(new Structure.Property(property.Name, propertyValue));
                    }
                }
                else
                {
                    throw new InvalidOperationException();
                }
            }

            foreach (var item in db.Items.AsNoTracking())
            {
                if (values.TryGetValue(item.ListId, out var existing) && existing is GraphList glist)
                {
                    glist.Items.Add(values[item.ItemId]);
                }
                else
                {
                    throw new InvalidOperationException();
                }
            }

            return g;
        }
    }
}