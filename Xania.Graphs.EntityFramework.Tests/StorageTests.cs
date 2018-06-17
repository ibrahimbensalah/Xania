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
using Xania.Graphs.Elements;
using Xania.Invoice.Domain;
using Xunit;
using Xunit.Abstractions;
using GraphObject = Xania.Graphs.Elements.GraphObject;
using Property = Xania.Graphs.Elements.Property;
using Vertex = Xania.Graphs.Elements.Vertex;

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
            {
                var g = Helper.GetGraph();
                db.Store(g);

            }
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
                // setup
                var g = db.LoadFull();

                // assert vertices count
                g.Vertices.Should().HaveSameCount(db.Vertices);

                // assert properties
                var properties = g.Vertices.SelectMany(GetProperties).ToArray();

                properties.Select(p => p.Name).Should().BeEquivalentTo(db.Properties.Select(e => e.Name));

                // assert edges
                g.Edges
                    .Select(e => new
                    {
                        InV = g.Vertices.Single(v => v.Id.Equals(e.InV)),
                        OutV = g.Vertices.Single(v => v.Id.Equals(e.OutV)),
                    })
                    .Should()
                    .HaveSameCount(g.Edges)
                    ;
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
