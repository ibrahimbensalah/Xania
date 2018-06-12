using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Xania.Graphs.EntityFramework.Tests.Relational;
using Xania.Graphs.EntityFramework.Tests.Relational.Queries;
using Xania.Graphs.Linq;
using Xania.Graphs.Structure;
using Xania.Invoice.Domain;
using Xunit;
using Xunit.Abstractions;
using GraphObject = Xania.Graphs.Structure.GraphObject;
using Property = Xania.Graphs.Structure.Property;
using Vertex = Xania.Graphs.Structure.Vertex;

namespace Xania.Graphs.EntityFramework.Tests
{
    public class StorageTests
    {
        private readonly ITestOutputHelper _output;
        private readonly LoggerFactory _loggerFactory;

        public StorageTests(ITestOutputHelper output)
        {
            _output = output;
            _loggerFactory = new LoggerFactory(new[]
            {
                new XunitLoggerProvider(_output),
            });
        }

        [Fact]
        public void ResetDb()
        {
            using (var db = new GraphDbContext(_loggerFactory))
            {
                db.Database.EnsureDeleted();
                db.Database.EnsureCreated();
            }
        }

        [Fact]
        public void InitializeDb()
        {
            using (var db = new GraphDbContext(_loggerFactory))
                db.Store(GetGraph());
        }

        private static Graph GetGraph()
        {
            return Graph.FromObject(
                new Person
                {
                    Id = 1,
                    Name = "Person 1",
                    Friends = new[] {new Person {Id = 2, Name = "Person 2"}, new Person {Id = 3, Name = "Person 3"}},
                    Lines = new List<AddressLine>
                    {
                        new AddressLine {Value = "Punter 315", Type = AddressType.Street},
                        new AddressLine {Value = "Amstelveen", Type = AddressType.Location},
                        new AddressLine {Value = "1186 PW", Type = AddressType.ZipCode},
                    }
                }
            );
        }

        [Fact]
        public void ReadVertexProperties()
        {
            using (var db = new GraphDbContext(_loggerFactory))
            {
                var vertices = new DbQueryable<Vertex>(new DbQueryProvider(db));
                var result = vertices.Where(v => v.Id.Equals("1")).SelectMany(v => v.Properties).ToArray();

                _output.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));

                result.Should().HaveCount(2);
            }
        }

        [Fact]
        public void ReadComplexObject()
        {
            using (var db = new GraphDbContext(_loggerFactory))
            {
                var vertices = new DbQueryable<Vertex>(new DbQueryProvider(db));
                var result =
                    (from v in vertices
                        select new
                        {
                            v.Id,
                            Count = v.Properties.Count()
                        }
                    ).ToArray();

                _output.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));

                result.Should().HaveCount(3);
            }
        }

        [Fact]
        public void InferTypeArgumentTest()
        {
            var method = typeof(Queryable).FindOverload("SelectMany", typeof(DbSet<Relational.Vertex>),
                typeof(Expression<Func<Relational.Vertex, IQueryable<Xania.Graphs.EntityFramework.Tests.Relational.Property>>>));

            method.ContainsGenericParameters.Should().BeFalse();
            method.Should().NotBeNull();
        }

        [Fact]
        public void LoadGraphTest()
        {
            using (var db = new GraphDbContext(_loggerFactory))
            {
                var g = db.LoadFull();

                g.Vertices.Should().HaveSameCount(db.Vertices);
                g.Vertices.SelectMany(GetProperties).Select(p => p.Name).Should().BeEquivalentTo(db.Properties.Select(e => e.Name));

                _output.WriteLine(string.Join(" | ",
                    g.Vertices
                        .SelectMany(GetProperties)
                        .Select(p => p.Value)
                        .OfType<GraphPrimitive>()
                        .Select(p => p.Value))
                );
            }
        }

        private IEnumerable<Property> GetProperties(GraphValue value)
        {
            if (value is GraphObject obj)
            {
                foreach (var prop in obj.Properties)
                {
                    yield return prop;

                    foreach (var x in GetProperties(prop.Value))
                        yield return x;
                }
            }
            else
            if (value is GraphList list)
            {
                foreach (var x in list.Items.SelectMany(GetProperties))
                    yield return x;
            }
        }
    }

    public static class HelperExtensions
    {
        public static TValue AddAndReturn<TKey, TValue>(this IDictionary<TKey, TValue> dict, TKey key, TValue value)
        {
            dict.Add(key, value);
            return value;
        }
    }
}
