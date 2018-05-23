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
using Xunit.Abstractions;

namespace Xania.Graphs.EntityFramework.Tests
{
    public class UnitTest1
    {
        private readonly ITestOutputHelper _output;
        private LoggerFactory _loggerFactory;

        public UnitTest1(ITestOutputHelper output)
        {
            _output = output;
            _loggerFactory = new LoggerFactory(new[]
            {
                new XunitLoggerProvider(_output),
            });

        }

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

            using (var db = new Relational.GraphDbContext(_loggerFactory))
            {
                db.Database.EnsureDeleted();
                db.Database.EnsureCreated();

                foreach (var v in graph.Vertices)
                {
                    db.Vertices.Add(
                        new Relational.Vertex { Id = v.Id, Label = v.Label }
                    );
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
                                        db.Items.Add(new Item { Id = itemId, ObjectId = objectId });

                                        valuesStack.Push((itemId, item));
                                    }
                                }
                            }
                        }
                    }
                }
                db.SaveChanges();
            }
        }

        [Fact]
        public void Read()
        {
            using (var db = new GraphDbContext(_loggerFactory))
            {
                var persons =
                    (from v in db.Vertices
                    select new 
                    {
                        Id = v.Id,
                        Label = v.Label,
                        Properties = 
                            from p in db.Properties
                            where p.ObjectId == v.Id
                            select new
                            {
                                Name = p.Name
                            }
                    }
                    ).ToArray();
                _output.WriteLine(JsonConvert.SerializeObject(persons, Formatting.Indented));

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

    public class XunitLoggerProvider : ILoggerProvider
    {
        private readonly ITestOutputHelper _testOutputHelper;

        public XunitLoggerProvider(ITestOutputHelper testOutputHelper)
        {
            _testOutputHelper = testOutputHelper;
        }

        public ILogger CreateLogger(string categoryName)
            => new XunitLogger(_testOutputHelper, categoryName);

        public void Dispose()
        { }
    }

    public class XunitLogger : ILogger
    {
        private readonly ITestOutputHelper _testOutputHelper;
        private readonly string _categoryName;

        public XunitLogger(ITestOutputHelper testOutputHelper, string categoryName)
        {
            _testOutputHelper = testOutputHelper;
            _categoryName = categoryName;
        }

        public IDisposable BeginScope<TState>(TState state)
            => NoopDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel)
            => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            _testOutputHelper.WriteLine($"{_categoryName} [{eventId}] {formatter(state, exception)}");
            if (exception != null)
                _testOutputHelper.WriteLine(exception.ToString());
        }

        private class NoopDisposable : IDisposable
        {
            public static NoopDisposable Instance = new NoopDisposable();
            public void Dispose()
            { }
        }
    }
}
