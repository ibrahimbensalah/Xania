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
                                        db.Items.Add(new Relational.Item { ValueId = itemId, ListId = objectId });

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
        public void InitGraphTest()
        {
            using (var db = new GraphDbContext(_loggerFactory))
            {
                var g = new Graph();
                var values = new Dictionary<string, GraphValue>();
                foreach (var v in db.Vertices.AsNoTracking())
                {
                    var vertex = new Vertex(v.Label) { Id = v.Id };
                    g.Vertices.Add(vertex);
                    values.Add(v.Id, vertex);
                }

                foreach(var prim in db.Primitives.AsNoTracking())
                    values.Add(prim.Id, new GraphPrimitive(prim.Value));

                var queue = new Queue<(GraphValue, string)>();
                foreach (var prop in db.Properties.AsNoTracking())
                {
                    GraphObject gobject;
                    if (values.TryGetValue(prop.ObjectId, out var exiting))
                    {
                        gobject = exiting as GraphObject;
                        if (gobject == null)
                            throw new InvalidOperationException();
                    }
                    else
                    {
                        gobject = new GraphObject();
                        values.Add(prop.ObjectId, gobject);
                    }
                    queue.Enqueue((gobject, prop.ValueId));

                    //if (!values.TryGetValue(prop.ValueId, out var value))
                    //{
                    //    properties.Enqueue(prop);
                    //}
                    //else
                    //{
                    //    gobject.Properties.Add(new Structure.Property(prop.Name, value));
                    //}
                }

                foreach (var item in db.Items.AsNoTracking())
                {
                    GraphList glist;
                    if (values.TryGetValue(item.ListId, out var exiting))
                    {
                        glist = exiting as GraphList;
                        if (glist == null)
                            throw new InvalidOperationException();
                    }
                    else
                    {
                        glist = new GraphList();
                        values.Add(item.ListId, glist);
                    }

                    queue.Enqueue((glist, item.ValueId));
                    //if (!values.TryGetValue(item.Id, out var value))
                    //{
                    //    items.Enqueue(item);
                    //}
                    //else
                    //{
                    //    glist.Items.Add(value);
                    //}
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
