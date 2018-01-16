using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
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

            var q = new VertexQuery(_graph, Expression.Constant(_graph.Vertices)).Execute(
                traversal,
                new (string name, IGraphQuery result)[0]
            );

            return Task.FromResult((IEnumerable<object>)q.Execute(elementType));
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

        public IStepQuery Next(IStep step)
        {
            if (step is V vertex)
            {
                return new FilterStep<Vertex>(_graph, x => x.Label.Equals(vertex.Label, StringComparison.InvariantCultureIgnoreCase));
            }

            if (step is Has has)
            {
                return new FilterStep<Vertex>(_graph, GetPropertyPredicate(has.Property, has.CompareStep));
            }

            if (step is Where where)
            {
                return new FilterStep<Vertex>(_graph, GetVertexPredicate(@where.Predicate, new(string name, Expression result)[0]));
            }

            if (step is Out @out)
            {
                return new OutStep<Vertex>(_graph, GetOutExpression(@out));
            }

            if (step is Project project)
            {
                var param = Expression.Parameter(typeof(Vertex));
                var listInit = GetProjectionExpression(param, project);
                return new ProjectStep(Expression.Lambda(listInit, param));
            }

            if (step is Values values)
            {
                Expression<Func<Vertex, object>> q = v =>
                    v.Properties.Where(p => p.Name.Equals(values.Name)).Select(p => p.Value).FirstOrDefault();

                return new ProjectStep(q);
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

    internal class ProjectStep : IStepQuery
    {
        private readonly LambdaExpression _selectorExpr;

        public ProjectStep(LambdaExpression selectorExpr)
        {
            _selectorExpr = selectorExpr;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            var sourceType = sourceExpr.Type.GetItemType();
            var selectMethod = QueryableHelper.Select_TSource_2(sourceType, _selectorExpr.Body.Type);
            var anoExpr = Expression.Call(selectMethod, sourceExpr, _selectorExpr);

            return new AnonymousQuery(anoExpr);
        }
    }

    internal class OutStep<T> : IStepQuery
    {
        private readonly Graph _graph;
        private readonly Expression<Func<T, IEnumerable<T>>> _selectorExpr;

        public OutStep(Graph graph, Expression<Func<T, IEnumerable<T>>> selectorExpr)
        {
            _graph = graph;
            _selectorExpr = selectorExpr;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            var manyMethod = QueryableHelper.SelectMany_TSource_2<T, T>();
            var many = Expression.Call(manyMethod, sourceExpr, _selectorExpr);
            return new VertexQuery(_graph, many);
        }
    }

    internal class FilterStep<TElement> : IStepQuery
    {
        private readonly Graph _graph;
        private readonly Expression<Func<TElement, bool>> _predicate;

        public FilterStep(Graph graph, Expression<Func<TElement, bool>> predicate)
        {
            _graph = graph;
            _predicate = predicate;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            var whereMethod = QueryableHelper.Where_TSource_1<TElement>();
            return new VertexQuery(_graph, Expression.Call(whereMethod, sourceExpr, _predicate));
        }
    }

    internal class ValuesQuery
    {
        //private readonly Graph _graph;
        //private readonly Expression _expression;

        //public ValuesQuery(Graph graph, Expression expression)
        //{
        //    _graph = graph;
        //    _expression = expression;
        //}

        //public object Execute(Type elementType)
        //{
        //    var f = Expression.Lambda<Func<IQueryable<object>>>(_expression).Compile();
        //    return f();
        //}

        //public IStepQuery Next(IStep step)
        //{
        //    if (step is Out o)
        //    {
        //        var property = TypeDescriptor.GetProperties(_expression.Type)
        //            .OfType<PropertyDescriptor>()
        //            .First(p => p.Name.Equals(o.EdgeLabel, StringComparison.InvariantCultureIgnoreCase));

        //        var propertyExpr = Expression.Property(_expression, property.Name);
        //        return new ValuesQuery(_graph, propertyExpr).ToStepQuery();
        //    }

        //    throw new NotImplementedException($"{step.GetType()}");
        //}

        //public Expression Expression => _expression;

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

        public IStepQuery Next(IStep step)
        {
            if (step is Out o)
            {
                //var property = TypeDescriptor.GetProperties(elementType)
                //    .OfType<PropertyDescriptor>()
                //    .First(p => p.Name.Equals(o.EdgeLabel, StringComparison.InvariantCultureIgnoreCase));

                //var param = Expression.Parameter(elementType);
                //var propertyExpr = Expression.Property(param, property.Name);

                //return new OutStep<object>(null, Expression.Lambda<Func<object, IEnumerable<object>>>(propertyExpr, param), property.PropertyType);
            }
            throw new NotSupportedException($"{step.GetType()}");
        }

        public Expression Expression => _sourceExpr;
    }

    public interface IGraphQuery
    {
        object Execute(Type elementType);
        IStepQuery Next(IStep step);
        Expression Expression { get; }
    }

    public interface IStepQuery
    {
        IGraphQuery Query(Expression sourceExpr);
    }
}