using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;
using Xania.Graphs.Linq;
using Xania.Models;
using Xania.Reflection;
using TypeExtensions = Xania.Reflection.TypeExtensions;

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

            // act
            var company = companies.Where(e => e.Name == "Xania Software").Should().ContainSingle().Subject;

            // assert
            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }
    }

    public class TestData
    {
        public static Graph GetPeople()
        {
            var friend = new Person { Id = 2 };
            var ibrahim = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = friend,
                Enemy = new Person { Id = 3, Friends = { friend } },
                HQ = new Address
                {
                    FullName = "Freddy Corleone",
                    Location = "Amstelveen",
                    Lines = { new AddressLine { Type = AddressType.Street, Value = "Punter 315" } }
                },
                Tags = new[] { "Programmer", "Entrepeneur" },
                Friends = { friend }
            };
            friend.Friends.Add(new Person { Id = 4, Friend = new Person { Id = 5 } });

            return Graph.FromObject(friend, ibrahim);
        }
    }

    public class Person : MarshalByRefObject
    {
        public int Id { get; set; }
        public Person Friend { get; set; }
        public string FirstName { get; set; }
        public Person Enemy { get; set; }
        public Address HQ { get; set; }
        public string[] Tags { get; set; }
        public ICollection<Person> Friends { get; } = new List<Person>();
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
            var v = graph.Vertices.Where(e => e.Id.Equals("4")).ToArray();
            Console.WriteLine(JsonConvert.SerializeObject(graph, Formatting.Indented));
        }

        public Task<IEnumerable<object>> ExecuteAsync(GraphTraversal traversal, Type elementType)
        {
            var graph = _graph;
            IExecuteResult result = new VerticesResult(graph.Vertices, graph);
            Console.WriteLine(traversal);

            var aliases = new Dictionary<string, IExecuteResult>();

            foreach (var step in traversal.Steps)
            {
                if (step is Alias a)
                    aliases[a.Value] = result;
                else
                    result = result.Execute(step);
            }

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
            IExecuteResult Execute(IStep step);
            IEnumerable<object> OfType(Type elementType, Graph graph);
        }

        private class VerticesResult : IExecuteResult
        {
            private readonly IEnumerable<Vertex> _vertices;
            private readonly Graph _graph;

            public VerticesResult(IEnumerable<Vertex> vertices, Graph graph)
            {
                _vertices = vertices;
                _graph = graph;
            }

            public IExecuteResult Execute(IStep step)
            {
                if (step is V V)
                {
                    var r = _vertices.Where(vertex =>
                        vertex.Label.Equals(V.Label, StringComparison.InvariantCultureIgnoreCase));
                    return new VerticesResult(r, _graph);
                }

                if (step is Values values)
                {
                    var x = _vertices.Select(vtx =>
                        vtx.Properties.Where(p => p.Name.Equals(values.Name, StringComparison.InvariantCultureIgnoreCase))
                            .Select(e => e.Value).SingleOrDefault());

                    return new ValuesResult(x);
                }

                if (step is Out O)
                {
                    var r = _vertices.SelectMany(from => _graph.Out(from, O.EdgeLabel));
                    return new VerticesResult(r, _graph);
                }

                if (step is Has has)
                {
                    var par = Expression.Parameter(typeof(Vertex));
                    var lambda = Expression.Lambda<Func<Vertex, bool>>(GetExpression(par, has), par).Compile();
                    var r = _vertices.Where(lambda);
                    return new VerticesResult(r, _graph);
                }


                if (step is Project project)
                {
                    var parameter = Expression.Parameter(typeof(Vertex));
                    var select = project.Dict.ToDictionary(kvp => kvp.Key, kvp => Execute(parameter, kvp.Value));
                    return new ObjectsResult(select);
                }

                if (step is Where where)
                {
                    var parameter = Expression.Parameter(typeof(Vertex));
                    var predicateExpr = Execute(parameter, where.Predicate);

                    var lambda = Expression.Lambda<Func<Vertex, bool>>(predicateExpr, parameter).Compile();
                    return new VerticesResult(_vertices.Where(lambda), _graph);
                }

                throw new NotImplementedException($"Execute {step.GetType()}");
            }

            private Expression Execute(Expression parameter, GraphTraversal traversal)
            {
                return traversal.Steps.Aggregate<IStep, Expression>(parameter, (src, st) =>
                {
                    if (src.Type == typeof(Vertex))
                        return GetExpression(src, st);

                    var p = Expression.Parameter(typeof(Vertex));
                    var stepExpr = GetExpression(p, st);

                    if (stepExpr.Type == typeof(IEnumerable<Vertex>))
                    {
                        var selectorLambda = Expression.Lambda<Func<Vertex, IEnumerable<Vertex>>>(stepExpr, p);
                        var selectManyMethod = SelectMany_TSource_2<Vertex, Vertex>();
                        return Expression.Call(null, selectManyMethod, src, selectorLambda);
                    }

                    if (stepExpr.Type == typeof(bool))
                    {
                        var selectorLambda = Expression.Lambda<Func<Vertex, bool>>(stepExpr, p);
                        var anyMethod = Any_TSource_1<Vertex>();
                        return Expression.Call(null, anyMethod, src, selectorLambda);
                    }

                    throw new NotImplementedException();
                    //if (stepExpr.Type == typeof(bool))
                    //{
                    //    return stepExpr;
                    //}
                    //else
                    //{
                    //    return stepExpr;
                    //    //var selectorLambda = Expression.Lambda<Func<Vertex, IEnumerable<Vertex>>>(selectorBody, p);
                    //    //var selectManyMethod = SelectMany_TSource_2<Vertex, Vertex>();
                    //    //return Expression.Call(null, selectManyMethod, src, selectorLambda);
                    //}
                });
            }

            private Expression GetExpression(Expression source, IStep step)
            {
                if (step is Has has)
                {
                    if (has.Property.Equals("id", StringComparison.InvariantCultureIgnoreCase))
                    {
                        var idExpr = Expression.Property(source, nameof(Vertex.Id));
                        return GetExpression(idExpr, has.CompareStep);
                    }
                    else
                    {
                        var propertiesExpr = Expression.Property(source, "Properties");

                        var propertyParam = Expression.Parameter(typeof(Property));

                        var propertyNameExpr =
                            Expression.Property(propertyParam, typeof(Property), nameof(Property.Name));
                        var equalName = Expression.Equal(propertyNameExpr, Expression.Constant(has.Property));

                        var propertyValueExpr =
                            Expression.Property(propertyParam, typeof(Property), nameof(Property.Value));
                        var valueExpr = GetExpression(propertyValueExpr, has.CompareStep);

                        var propertyLambda = Expression.Lambda(Expression.And(equalName, valueExpr), propertyParam);

                        var anyMethod = Any_TSource_1<Property>();
                        return Expression.Call(null, anyMethod, propertiesExpr, propertyLambda);
                    }
                }

                if (step is Eq eq)
                {
                    Func<Object, Object, bool> equals = Object.Equals;
                    return Expression.Call(null, equals.Method, source, GetExpression(null, eq.Steps.Single()));
                    // return Expression.Equal(source, GetExpression(null, eq.Steps.Single()));
                }

                if (step is Const cons)
                    return Expression.Constant(cons.Value);

                if (step is Context)
                    return source;

                if (step is Out O)
                {
                    Expression<Func<Vertex, IEnumerable<Vertex>>> q = from => _graph.Out(from, O.EdgeLabel);
                    return new ReplaceVisitor(q.Parameters[0], source).VisitAndConvert(q.Body);
                    // source.SelectMany(e => e.O.Edgelabel)
                    //var r =
                    //    _vertices.SelectMany(from =>
                    //            _graph.Edges.Where(edge =>
                    //                edge.Label.Equals(O.EdgeLabel, StringComparison.InvariantCultureIgnoreCase) &&
                    //                edge.OutV.Equals(from.Id, StringComparison.InvariantCultureIgnoreCase)))
                    //        .Select(edge => _graph.Vertices.Single(to => to.Id.Equals(edge.InV)));

                    //return new VerticesResult(r, _graph);
                }

                throw new NotImplementedException($"GetExpression {step.GetType()}");
            }

            public IEnumerable<object> OfType(Type elementType, Graph graph)
            {
                var cache = new Dictionary<Vertex, object>();
                return _vertices.Select(v => graph.ToObject(v, elementType, cache));
            }

            private static MethodInfo s_SelectMany_TSource_2;
            public static MethodInfo SelectMany_TSource_2<TSource, TResult>() =>
                (s_SelectMany_TSource_2 ??
                 (s_SelectMany_TSource_2 = new Func<IEnumerable<TSource>, Func<TSource, IEnumerable<TResult>>, IEnumerable<TResult>>(Enumerable.SelectMany).GetMethodInfo().GetGenericMethodDefinition()))
                .MakeGenericMethod(typeof(TSource), typeof(TResult));


            private static MethodInfo s_Where_TSource_1;
            public static MethodInfo Where_TSource_1<TSource>() =>
                (s_Where_TSource_1 ??
                 (s_Where_TSource_1 = new Func<IEnumerable<TSource>, Func<TSource, bool>, IEnumerable<TSource>>(Enumerable.Where).GetMethodInfo().GetGenericMethodDefinition()))
                .MakeGenericMethod(typeof(TSource));

            private static MethodInfo s_Any_TSource_1;
            public static MethodInfo Any_TSource_1<TSource>() =>
                (s_Any_TSource_1 ??
                 (s_Any_TSource_1 = new Func<IEnumerable<TSource>, Func<TSource, bool>, bool>(Enumerable.Any)
                     .GetMethodInfo().GetGenericMethodDefinition()))
                .MakeGenericMethod(typeof(TSource));

        }
    }

    internal class ObjectsResult : InMemoryGraphDbContext.IExecuteResult
    {
        public Dictionary<string, Expression> Dict { get; }

        public ObjectsResult(Dictionary<string, Expression> dict)
        {
            Dict = dict;
        }

        public InMemoryGraphDbContext.IExecuteResult Execute(IStep step)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<object> OfType(Type elementType, Graph graph)
        {
            throw new NotImplementedException();
        }
    }

    internal class ValuesResult : InMemoryGraphDbContext.IExecuteResult
    {
        public IEnumerable<object> Values { get; }

        public ValuesResult(IEnumerable<object> values)
        {
            Values = values.ToArray();
        }

        public InMemoryGraphDbContext.IExecuteResult Execute(IStep step)
        {
            if (step is Out o)
            {
                var r = Values.OfType<IDictionary<string, object>>().Where(e => e.ContainsKey(o.EdgeLabel)).Select(e => e[o.EdgeLabel]);
                return new ValuesResult(r);
            }
            throw new NotImplementedException("Execute ");
        }

        public IEnumerable<object> OfType(Type elementType, Graph graph)
        {
            return Values.Select(v => v.Convert(elementType));
        }
    }

    class ReplaceVisitor : ExpressionVisitor
    {
        private readonly Expression _source;
        private readonly Expression _target;

        public ReplaceVisitor(Expression source, Expression target)
        {
            if (source.Type != target.Type)
                throw new InvalidOperationException();

            _source = source;
            _target = target;
        }

        internal Expression VisitAndConvert(Expression root)
        {
            return Visit(root);
        }

        public override Expression Visit(Expression node)
        {
            if (node == _source)
                return _target;

            return base.Visit(node);
        }
    }
}
