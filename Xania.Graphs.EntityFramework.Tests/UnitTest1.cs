using System;
using System.Collections;
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
using Vertex = Xania.Graphs.Structure.Vertex;

namespace Xania.Graphs.EntityFramework.Tests
{
    public class UnitTest1
    {
        private readonly ITestOutputHelper _output;
        private readonly LoggerFactory _loggerFactory;

        public UnitTest1(ITestOutputHelper output)
        {
            _output = output;
            _loggerFactory = new LoggerFactory(new[]
            {
                new XunitLoggerProvider(_output),
            });
        }

        [Fact]
        public void InitializeDb()
        {
            var graph = GetGraph();

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
        }

        private static Graph GetGraph()
        {
            var graph = Graph.FromObject(
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
            return graph;
        }

        [Fact]
        public void ReadVertex1()
        {
            using (var db = new Relational.GraphDbContext(_loggerFactory))
            {
                Expression<Func<int, IQueryable<Relational.Property>>> q = e => db.Vertices.SelectMany(v => db.Properties.Where(p => p.ObjectId == v.Id));

                _output.WriteLine(q.Body.ToString());

                //var vertices = new DbQueryable<Vertex>(new DbQueryProvider(db));
                //var result = vertices.Where(v => v.Id.Equals("1")).Select(v => v.Id).ToArray();

                //_output.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));

                //result.Should().HaveCount(1);
            }
        }

        [Fact]
        public void ReadVertexProperties()
        {
            using (var db = new Relational.GraphDbContext(_loggerFactory))
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
            using (var db = new Relational.GraphDbContext(_loggerFactory))
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
                var g = new Graph();
                var values = new Dictionary<string, GraphValue>();

                foreach (var prim in db.Primitives.AsNoTracking())
                    values.Add(prim.Id, new GraphPrimitive(prim.Value));

                foreach (var listId in db.Items.Select(p => p.ListId).Distinct().AsNoTracking())
                    values.Add(listId, new GraphList());

                foreach (var v in db.Vertices.AsNoTracking())
                {
                    var vertex = new Vertex(v.Label) { Id = v.Id };
                    g.Vertices.Add(vertex);
                    values.Add(v.Id, vertex);
                }

                foreach (var propertyGroup in db.Properties.GroupBy(p => p.ObjectId).AsNoTracking())
                {
                    var objectId = propertyGroup.Key;
                    var entry = values.TryGetValue(objectId, out var value)
                        ? value
                        : values.AddAndReturn(objectId, new GraphObject());

                    if (entry is GraphObject obj)
                    {
                        foreach (var property in propertyGroup)
                        {
                            obj.Properties.Add(new Structure.Property(property.Name, values[property.ValueId]));
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
