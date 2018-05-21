using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using Newtonsoft.Json;
using Xania.Graphs.EntityFramework.Tests.Relational;
using Xania.Graphs.Structure;
using Xania.Invoice.Domain;
using Xunit;

namespace Xania.Graphs.EntityFramework.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {
            var graph = Graph.FromObject(
                new Person
                {
                    Id = 1,
                    Name = "Person 1",
                    Friends = new[] { new Person { Id = 2, Name = "Person 2" }, new Person { Id = 3, Name = "Person 3" } },
                    Lines = new List<AddressLine>
                    {
                        new AddressLine { Value = "Punter 315", Type = AddressType.Street },
                        new AddressLine { Value = "Amstelveen", Type = AddressType.Location },
                        new AddressLine { Value = "1186PW", Type = AddressType.ZipCode },
                    }
                }
            );

            using (var db = new Relational.GraphDbContext())
            {
                db.Database.EnsureDeleted();
                db.Database.EnsureCreated();

                foreach (var v in graph.Vertices)
                {
                    db.Vertices.Add(
                        new Relational.Vertex { Id = v.Id, Label = v.Label }
                    );
                    var propertiesStack = new Stack<(string, IEnumerable<Structure.Property>)>();
                    propertiesStack.Push((Guid.NewGuid().ToString(), v.Properties));

                    while (propertiesStack.Count > 0)
                    {
                        var (objectId, properties) = propertiesStack.Pop();
                        foreach (var p in properties)
                        {
                            var property =
                                new Relational.Property {Name = p.Name, ObjectId = objectId, ValueId = Guid.NewGuid().ToString() };
                            db.Properties.Add(property);

                            var valuesStack = new Stack<(string, GraphValue)>();
                            valuesStack.Push( (property.ValueId, p.Value) );

                            while (valuesStack.Count > 0)
                            {
                                var (valueId, value) = valuesStack.Pop();

                                if (value is Structure.GraphPrimitive prim)
                                {
                                    db.Primitives.Add(new Primitive
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
                                        db.Items.Add(new Item {Id = itemId, ObjectId = objectId});

                                        valuesStack.Push( (itemId, item) );
                                    }
                                }
                            }
                        }
                    }
                }
                db.SaveChanges();
            }

            using (var db = new GraphDbContext())
            {


                var persons =
                    from v in db.Vertices
                    select new Structure.Vertex(v.Label);
                Console.WriteLine(persons.ToString());

                persons.Should().HaveCount(3);

            }
        }
    }

    public class Person
    {
        public int Id { get; set; }
        public ICollection<Person> Friends { get; set; }
        public string Name { get; set; }
        public ICollection<AddressLine> Lines { get; set; } = new Collection<AddressLine>();
    }

    namespace Relational
    {
        public class GraphDbContext : DbContext
        {
            public DbSet<Vertex> Vertices { get; set; }
            public DbSet<Property> Properties { get; set; }
            public DbSet<Primitive> Primitives { get; set; }
            public DbSet<Item> Items { get; set; }

            public static readonly LoggerFactory MyLoggerFactory = new LoggerFactory(new[]
            {
                new ConsoleLoggerProvider((category, level) => true, true)
            });

            protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
            {
                optionsBuilder
                    .UseLoggerFactory(MyLoggerFactory)
                    .UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=GraphDb;Trusted_Connection=True;");
            }

            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                modelBuilder.Entity<Property>()
                    .HasKey(e => new { e.ObjectId, e.Name });
            }
        }

        public class Property
        {
            public string Name { get; set; }
            public string ObjectId { get; set; }
            public string ValueId { get; set; }
        }

        public interface IGraphValue
        {
            string Id { get; set; }
        }

        public class Primitive : IGraphValue
        {
            public string Value { get; set; }
            public string Id { get; set; }
        }

        public interface IGraphObject : IGraphValue
        {
            HashSet<Property> Properties { get; }
        }

        public class GraphObject : IGraphValue
        {
            public string Id { get; set; }
        }

        public class Vertex
        {
            public string Id { get; set; }
            public string Label { get; set; }
        }

        public class Item
        {
            public string Id { get; set; }
            public string ObjectId { get; set; }
        }
    }

}
