using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;
using Xania.Graphs.Linq;
using Xania.Models;
using Xania.Reflection;

namespace Xania.Graphs.Runtime.Tests
{
    public class RuntimeTests
    {
        static readonly Company xania = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Xania Software",
            Address = new Address
            {
                FullName = "Ibrahim ben Salah",
                Location = "Amstelveen",
                Lines =
                {
                    new AddressLine { Type = AddressType.Street, Value = "Punter 315" }
                }
            }
        };
        static readonly Company rider = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Rider International",
            Address = new Address
            {
                FullName = "Edi Grittenberg",
                Location = "Leiden",
                Lines =
                {
                    new AddressLine { Type = AddressType.Street, Value = "Leiden centrum 1" }
                }
            }
        };

        [Test]
        public void QueryBasicTest()
        {
            // arrange
            var db = new InMemoryGraphDbContext(xania);
            var companies = db.Set<Company>();

            // act
            var company = companies.Should().ContainSingle().Subject;

            // assert
            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }

        [Test]
        public void QueryMemberTest()
        {
            // arrange
            var contract = new Contract(xania, rider);
            var db = new InMemoryGraphDbContext(contract);
            var contracts = db.Set<Contract>();

            // act
            var suppliers = contracts.Select(e => e.Supplier);
            var company = suppliers.Should().ContainSingle().Subject;

            // assert
            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }

        [Test]
        public void QueryFilterTest()
        {
            // arrange
            var db = new InMemoryGraphDbContext(xania, rider);
            var companies = db.Set<Company>();

            for (var i = 0; i < 1000; i++)
            {
                // act
                var company = companies.Where(e => e.Name == "Xania Software").Should().ContainSingle().Subject;

                // assert
                company.Id.Should().Be(xania.Id);
                company.Name.Should().Be(xania.Name);
                company.Address.Should().NotBeNull();
                company.Address.FullName.Should().Be(xania.Address.FullName);
            }
        }
    }

    public class Contract
    {
        public DateTimeOffset StartDate { get; }
        public Company Supplier { get; }
        public Company Client { get; }

        public Contract()
        {
            StartDate = DateTimeOffset.Now;
        }

        public Contract(Company supplier, Company client)
            : this()
        {
            Supplier = supplier;
            Client = client;
        }
    }

    public class InMemoryGraphDbContext : IGraphDataContext
    {
        private readonly Graph _graph;

        public InMemoryGraphDbContext(params object[] models) : this(Graph.FromObject(models))
        {
        }

        public InMemoryGraphDbContext(Graph graph)
        {
            _graph = graph;
            Console.WriteLine(JsonConvert.SerializeObject(graph, Formatting.Indented));
        }

        public Task<IEnumerable<object>> ExecuteAsync(GraphTraversal traversal, Type elementType)
        {
            var graph = _graph;
            IExecuteResult result = new VerticesResult(graph.Vertices);

            var aliases = new Dictionary<string, IExecuteResult>();

            foreach (var step in traversal.Steps)
            {
                if (step is Alias a)
                    aliases[a.Value] = result;
                else
                    result = result.Execute(step, graph);
            }

            //foreach (var step in traversal.Steps)
            //{
            //    if (step is V V)
            //    {
            //        var vertices = _graph.Vertices.Where(vertex => vertex.Label.Equals(V.Label));
            //        var adjancyList = vertices.ToDictionary(e => e, e => _graph.Edges.Where(edge => edge.OutV.Equals(e.Id)));
            //    }

            //    throw new NotImplementedException($"Execute {step.GetType()}");
            //}


            //var result =
            //    result.Select(v => CreateInstance(v, elementType));

            return Task.FromResult(result.OfType(elementType, graph));
        }

        private object CreateInstance(Vertex v, Type elementType)
        {
            var valueFactories = v.Properties
                .ToDictionary<Property, string, Func<Type, object>>(
                    e => e.Name,
                    e => t => e.Value.Convert(t),
                    StringComparer.InvariantCultureIgnoreCase
                );
            valueFactories.Add("id", v.Id.Convert);
            return elementType.CreateInstance(valueFactories);
        }


        public interface IExecuteResult
        {
            IExecuteResult Execute(IStep step, Graph graph);
            IEnumerable<object> OfType(Type elementType, Graph graph);
        }

        private class VerticesResult: IExecuteResult
        {
            private readonly IEnumerable<Vertex> _vertices;

            public VerticesResult(IEnumerable<Vertex> vertices)
            {
                _vertices = vertices;
            }

            public IExecuteResult Execute(IStep step, Graph graph)
            {
                if (step is V V)
                    return new VerticesResult(_vertices.Where(vertex =>
                        vertex.Label.Equals(V.Label, StringComparison.InvariantCultureIgnoreCase)));
                if (step is Out O)
                {
                    var r =
                        _vertices.SelectMany(from =>
                                graph.Edges.Where(edge =>
                                    edge.Label.Equals(O.EdgeLabel, StringComparison.InvariantCultureIgnoreCase) &&
                                    edge.OutV.Equals(from.Id, StringComparison.InvariantCultureIgnoreCase)))
                            .Select(edge => graph.Vertices.Single(to => to.Id.Equals(edge.InV)));

                    return new VerticesResult(r);
                }

                if (step is Has has)
                {
                    var par = Expression.Parameter(typeof(Property));
                    var lambda = Expression.Lambda<Func<Property, bool>>(GetExpression(par, has), par).Compile();
                    var r = _vertices.Where(v => v.Properties.Where(p => p.Name.Equals(has.Property)).Any(lambda));
                    return new VerticesResult(r);
                }
                else
                    throw new NotImplementedException($"Execute {step.GetType()}");
            }

            private Expression GetExpression(Expression vertexProperty, IStep step)
            {
                if (step is Has has)
                {
                    var propertyNameExpr = Expression.Property(vertexProperty, typeof(Property), nameof(Property.Name));
                    var equalName = Expression.Equal(propertyNameExpr, Expression.Constant(has.Property));

                    var propertyValueExpr = Expression.Property(vertexProperty, typeof(Property), nameof(Property.Value));
                    var valueExpr = GetExpression(propertyValueExpr, has.CompareStep);

                    return Expression.And(equalName, valueExpr);
                }

                if (step is Eq eq)
                    return Expression.Equal(vertexProperty, GetExpression(null, eq.Steps.Single()));

                if (step is Const cons)
                    return Expression.Constant(cons.Value);

                throw new NotImplementedException($"GetExpression {step.GetType()}");
            }

            public IEnumerable<object> OfType(Type elementType, Graph graph)
            {
                var cache = new Dictionary<Vertex, object>();
                return _vertices.Select(v => graph.ToObject(v, elementType, cache));
            }
        }
    }
}
