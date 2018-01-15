using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;
using System.Threading.Tasks;
using Xania.Graphs.Linq;
using Xania.Reflection;

namespace Xania.Graphs.Structure
{
    public class InMemoryGraphDbContext : IGraphDataContext
    {
        private readonly Graph _graph;

        public InMemoryGraphDbContext(params object[] models)
            : this(Graph.FromObject(models))
        {
        }

        public InMemoryGraphDbContext(Graph graph)
        {
            _graph = graph;
        }

        public Task<IEnumerable<object>> ExecuteAsync(GraphTraversal traversal, Type elementType)
        {
            Console.WriteLine(traversal);

            var q = Execute(
                new PivotQuery(_graph),
                traversal,
                elementType,
                new List<(string name, IGraphQuery result)>()
            );

            return Task.FromResult((IEnumerable<object>)q);
        }

        private static object Execute(IGraphQuery g, GraphTraversal traversal, Type elementType, IEnumerable<(string name, IGraphQuery result)> maps)
        {
            var (result, _) = traversal.Steps.Aggregate((input: g, maps: maps), (__, step) =>
            {
                var (r, m) = __;
                if (step is Alias a)
                    return (r, m.Prepend((a.Value, r)));

                if (step is Context)
                    return __;

                if (step is Select select)
                {
                    return (m.Select(select.Label), m);
                }

                return (r.Next(step), m);
            });

            return result.Execute(elementType);
        }

        private static IGraphQuery Select(IEnumerable<(string name, IGraphQuery result)> mappings, string name)
        {
            return mappings.Where(e => e.name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                .Select(e => e.result).First();
        }

        private void ExecuteVertexStep(IQueryable<Vertex> vertices, IStep step)
        {
            throw new NotImplementedException();
        }

        private (IStep, IEnumerable<IStep>) Destruct(IEnumerable<IStep> steps)
        {
            return (steps.First(), steps.Skip(1));
        }
    }

    internal class PivotQuery : IGraphQuery
    {
        private readonly Graph _graph;

        public PivotQuery(Graph graph)
        {
            _graph = graph;
        }

        public object Execute(Type elementType)
        {
            throw new NotImplementedException();
        }

        public IGraphQuery Next(IStep step)
        {
            if (step is V v)
            {
                var vertices = _graph.Vertices.Where(x => x.Label.Equals(v.Label, StringComparison.InvariantCultureIgnoreCase));
                return new VertexQuery(_graph, Expression.Constant(vertices));
            }
            throw new NotImplementedException();
        }
    }

    internal class VertexQuery : IGraphQuery
    {
        private readonly Graph _graph;
        public Expression Expression { get; }

        public VertexQuery(Graph graph, Expression expr)
        {
            _graph = graph;
            Expression = expr;
            Execute(typeof(object));
        }

        public object Execute(Type elementType)
        {
            var f = Expression.Lambda<Func<IQueryable<Vertex>>>(Expression).Compile();
            return f().Select(v => v.ToClrType(elementType, _graph));
        }

        public IGraphQuery Next(IStep step)
        {
            if (step is Has has)
            {
                Expression<Func<Vertex, bool>> p = GetPropertyPredicate(has.Property, has.CompareStep);
                var whereMethod = QueryableHelper.Where_TSource_1<Vertex>();
                return new VertexQuery(_graph, Expression.Call(whereMethod, Expression, p));
            }

            if (step is Where where)
            {
                Expression<Func<Vertex, bool>> predicate = GetVertexPredicate(@where.Predicate, new(string name, Expression result)[0]);
                var whereMethod = QueryableHelper.Where_TSource_1<Vertex>();
                return new VertexQuery(_graph, Expression.Call(whereMethod, Expression, predicate));
            }

            if (step is Out o)
            {
                var manyMethod = QueryableHelper.SelectMany_TSource_2<Vertex, Vertex>();
                var many = Expression.Call(manyMethod, Expression, GetOutExpression(o));
                return new VertexQuery(_graph, many);
            }

            if (step is Project project)
            {
                var param = Expression.Parameter(typeof(Vertex));
                var listInit = GetProjectionExpression(param, project);

                var sourceType = Expression.Type.GetItemType();
                var selectMethod = QueryableHelper.Select_TSource_2(sourceType, listInit.Type);
                var anoExpr = Expression.Call(selectMethod, Expression, Expression.Lambda(listInit, param));

                return new AnonymousQuery(anoExpr);
            }

            if (step is Values values)
            {
                Expression<Func<Vertex, object>> q = v =>
                    v.Properties.Where(p => p.Name.Equals(values.Name)).Select(p => p.Value).FirstOrDefault();

                var selectMethod = QueryableHelper.Select_TSource_2<Vertex, object>();
                var select = Expression.Call(selectMethod, Expression, q);
                return new ValuesQuery(_graph, select);
            }

            throw new NotImplementedException($"VertextQuery.Execute {step.GetType()}");
        }

        private Expression GetProjectionExpression(Expression param, Project project)
        {
            var addMethod = typeof(Dictionary<string, object>).GetMethod("Add");

            var bindings = project.Dict.Select(
                kvp =>
                {
                    var expr = GetExpression(param, kvp.Value, new(string name, Expression result)[0]);

                    return Expression.ElementInit(
                        addMethod,
                        Expression.Constant(kvp.Key),
                        Expression.Convert(expr, typeof(object))
                    );
                });


            return Expression.ListInit(
                Expression.New(typeof(Dictionary<string, object>)),
                bindings
            );
        }

        private Expression<Func<Vertex, bool>> GetVertexPredicate(GraphTraversal traversal,
            IEnumerable<(string name, Expression result)> mappings)
        {
            ParameterExpression param = Expression.Parameter(typeof(Vertex));
            var body = GetExpression(param, traversal, mappings);

            if (body.Type.IsEnumerable())
            {
                var itemType = body.Type.GetItemType();
                var anyMethod = QueryableHelper.Any_TSource_1(itemType);
                var any = Expression.Call(anyMethod, body);

                return Expression.Lambda<Func<Vertex, bool>>(any, param);
            }

            return Expression.Lambda<Func<Vertex, bool>>(body, param);
        }

        private Expression GetExpression(Expression param, GraphTraversal traversal, IEnumerable<(string name, Expression result)> mappings)
        {
            var body = traversal.Steps.Aggregate((input: param, mappings: mappings), (__, step) =>
            {
                if (step is Context)
                    return __;

                var (x, m) = __;

                if (step is Out o)
                {
                    if (x.Type != typeof(Vertex))
                        throw new NotSupportedException();

                    var q = GetOutExpression(o);

                    return (ReplaceVisitor.VisitAndConvert(q.Body, q.Parameters[0], x), m);
                }

                if (step is Values values)
                {
                    Expression<Func<Vertex, object>> mx = v => ValuesQuery.GetMember(v, values.Name);
                    if (x.Type == typeof(Vertex))
                    {
                        return (ReplaceVisitor.VisitAndConvert(mx.Body, mx.Parameters[0], x), m);
                    }
                    else
                    {
                        var selectMethod = QueryableHelper.Select_TSource_2<Vertex, object>();
                        return (Expression.Call(selectMethod, x, mx), m);
                    }
                }

                if (step is Has has)
                {
                    Expression<Func<Vertex, bool>> p = GetPropertyPredicate(has.Property, has.CompareStep);
                    var whereMethod = QueryableHelper.Where_TSource_1<Vertex>();
                    return (Expression.Call(whereMethod, x, p), m);
                }

                if (step is Select select)
                {
                    return (m.Select(select.Label), m);
                }

                if (step is Project project)
                {
                    return (GetProjectionExpression(x, project), m);
                }

                throw new NotImplementedException(step.GetType().ToString());
            });

            return body.input;
        }

        private Expression<Func<Vertex, IEnumerable<Vertex>>> GetOutExpression(Out @out)
        {
            return v =>
                from edge in _graph.Edges
                where edge.OutV.Equals(v.Id, StringComparison.InvariantCultureIgnoreCase) &&
                      edge.Label.Equals(@out.EdgeLabel, StringComparison.InvariantCultureIgnoreCase)
                join vertex in _graph.Vertices on edge.InV equals vertex.Id
                select vertex;
        }

        private Expression<Func<Vertex, bool>> GetPropertyPredicate(string propertyName, IStep compareStep)
        {
            if (compareStep is Eq eq)
                if (eq.Value is Const cons)
                {
                    if (propertyName.Equals("id", StringComparison.InvariantCultureIgnoreCase))
                        return v => v.Id.Equals(cons.Value);
                    else
                        return v => v.Properties.Any(p =>
                            p.Name.Equals(propertyName, StringComparison.InvariantCultureIgnoreCase) &&
                            p.Value.Equals(cons.Value));
                }

            throw new NotImplementedException();
        }
    }

    internal class ValuesQuery : IGraphQuery
    {
        private readonly Graph _graph;
        private readonly Expression _expression;

        public ValuesQuery(Graph graph, Expression expression)
        {
            _graph = graph;
            _expression = expression;
        }

        public object Execute(Type elementType)
        {
            var f = Expression.Lambda<Func<IQueryable<object>>>(_expression).Compile();
            return f();
        }

        public IGraphQuery Next(IStep step)
        {
            if (step is Out o)
            {
                var property = TypeDescriptor.GetProperties(_expression.Type)
                    .OfType<PropertyDescriptor>()
                    .First(p => p.Name.Equals(o.EdgeLabel, StringComparison.InvariantCultureIgnoreCase));

                var propertyExpr = Expression.Property(_expression, property.Name);
                return new ValuesQuery(_graph, propertyExpr);
            }

            throw new NotImplementedException($"{step.GetType()}");
        }

        public static object GetMember(object v, string name)
        {
            if (v is Vertex vtx && name.Equals("id", StringComparison.InvariantCultureIgnoreCase))
            {
                return vtx.Id;
            }
            if (v is Vertex obj)
            {
                return obj.Properties.Where(p => p.Name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                    .Select(p => p.Value).FirstOrDefault();
            }
            throw new NotImplementedException();
        }
    }

    internal class AnonymousQuery : IGraphQuery
    {
        private readonly Expression _sourceExpr;

        public AnonymousQuery(Expression sourceExpr)
        {
            _sourceExpr = sourceExpr;
        }

        public object Execute(Type elementType)
        {
            var result = Expression.Lambda(_sourceExpr).Compile();
            var list = new List<object>();
            foreach (var o in (IEnumerable<object>)result.DynamicInvoke())
            {
                list.Add(o.Convert(elementType));
            }
            return list;
        }

        public IGraphQuery Next(IStep step)
        {
            throw new NotSupportedException($"{step.GetType()}");
        }
    }

    internal interface IGraphQuery
    {
        object Execute(Type elementType);
        IGraphQuery Next(IStep step);
    }
}