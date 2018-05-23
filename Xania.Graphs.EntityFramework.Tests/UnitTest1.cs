using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Xania.Graphs.EntityFramework.Tests.Relational.Queries;
using Xania.Graphs.Structure;
using Xania.Invoice.Domain;
using Xunit;
using Xunit.Abstractions;

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
                                        db.Items.Add(new Relational.Item { Id = itemId, ObjectId = objectId });

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
                var vertices = new DbQueryable<Vertex>(new DbQueryProvider(db));
                var result = vertices.Where(v => v.Id.Equals("1")).Select(v => v.Id).ToArray();

                _output.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));

                result.Should().HaveCount(1);
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

                result.Should().HaveCount(3);
            }
        }

        public static Expression<Func<Person, bool>> PersonFilter
        {
            get { return Projection((Person p) => p.Name.StartsWith("Hallo")); }
        }

        private static Expression<Func<TSource, TResult>> Projection<TSource, TResult>(Expression<Func<TSource, TResult>> expr)
        {
            return expr;
        }
    }

}
