using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.Remoting.Messaging;
using System.Runtime.Remoting.Proxies;
using System.Security.Permissions;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Xania.Graphs.Linq;
using Xania.ObjectMapper;
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

            var q =
                new VertexQuery(_graph, Expression.Constant(_graph.Vertices))
                    .Execute(traversal);

            return Task.FromResult((IEnumerable<object>) q.Execute(elementType));
        }
    }

    internal class VertexQuery : IGraphQuery
    {
        public Graph Graph { get; }
        public Expression SourceExpression { get; }

        public VertexQuery(Graph graph, Expression expr)
        {
            Graph = graph;
            SourceExpression = expr;
        }

        public object Execute(Type elementType)
        {
            var f = Expression.Lambda(SourceExpression).Compile();
            var result = f.DynamicInvoke();

            var mapper = new Mapper(new VertexMappingResolver(Graph));

            if (result is IEnumerable<Vertex> enumerable)
            {
                var list = new List<object>();

                foreach (var entry in enumerable)
                {
                    var entity = mapper.MapTo(entry, elementType);
                    list.Add(entity);
                }

                return list;
            }
            else
            {
                return mapper.MapTo(result, elementType);
            }
        }

        public static Expression GetVertextExpression(Type elementType)
        {
            return Expression.New(elementType);
        }

        public IGraphQuery FilterStep<TElement>(Expression<Func<TElement, bool>> predicate)
        {
            var whereMethod = QueryableHelper.Where_TSource_1<TElement>();
            return new VertexQuery(Graph, Expression.Call(whereMethod, SourceExpression, predicate));
        }

        public IGraphQuery Next(Type sourceType, IStep step, IEnumerable<(string name, Expression result)> mappings)
        {
            if (step is V vertex)
            {
                return FilterStep((Vertex x) =>
                    x != null && x.Label.Equals(vertex.Label, StringComparison.InvariantCultureIgnoreCase));
            }

            if (step is Has has)
            {
                return FilterStep(GetPropertyPredicate(has.Property, has.CompareStep));
            }

            if (step is Where where)
            {
                return FilterStep(GetVertexPredicate(@where.Predicate, mappings));
            }

            if (step is Out @out)
            {
                return SelectManyStep.Query(Graph, @out, SourceExpression);
            }

            if (step is Project project)
            {
                var param = Expression.Parameter(typeof(Vertex));
                var projectionExpression = GetProjectionExpression(param, project, mappings);
                var selectorExpr = Expression.Lambda(projectionExpression, param);

                var selectMethod = QueryableHelper.Select_TSource_2(param.Type, selectorExpr.Body.Type);
                var anoExpr = Expression.Call(selectMethod, SourceExpression, selectorExpr);

                return new AnonymousQuery(Graph, anoExpr);
            }

            if (step is Values values)
            {
                var propertyType = values.Type;
                var propertyName = values.Name;
                var sourceExpr = SourceExpression;

                Expression<Func<Vertex, IEnumerable<object>>> query =
                    v => v.Properties
                        .Where(p => p.Name.Equals(propertyName, StringComparison.InvariantCultureIgnoreCase))
                        .Select(p => p.Value.Convert(propertyType));

                var param = Expression.Parameter(typeof(Object));
                var selectExpr = Expression.Call(
                    EnumerableHelper.Select_TSource_2(typeof(Object), propertyType),
                    query.Body,
                    Expression.Lambda(Expression.Convert(param, propertyType), param)
                );

                var firstMethod = EnumerableHelper.FirstOrDefault(propertyType);
                var selectorExpr = Expression.Lambda(Expression.Call(firstMethod, selectExpr), query.Parameters);
                var selectMethod = QueryableHelper.Select_TSource_2(typeof(Vertex), selectorExpr.Body.Type);
                var anoExpr = Expression.Call(selectMethod, sourceExpr, selectorExpr);

                return new AnonymousQuery(Graph, anoExpr);
            }

            throw new NotImplementedException($"VertextQuery.Execute {step.GetType()}");
        }

        private Expression GetProjectionExpression(Expression param, Project project,
            IEnumerable<(string name, Expression result)> mappings)
        {
            var bindings = project.Dict.Select(
                kvp =>
                {
                    // var x = g.Execute(kvp.Value, new(string name, IGraphQuery result)[0]);
                    var expr = GetExpression(param, kvp.Value, mappings);

                    if (TakeFirst(kvp.Value))
                    {
                        var elementType = expr.Type.GetItemType();
                        var firstMethod = EnumerableHelper.FirstOrDefault(elementType);
                        expr = Expression.Call(firstMethod, expr);
                    }

                    return Expression.ElementInit(
                        DictionaryHelper.Add<string, object>(),
                        Expression.Constant(kvp.Key),
                        Expression.Convert(expr, typeof(object))
                    );
                });

            return Expression.ListInit(
                Expression.New(typeof(Dictionary<string, object>)),
                bindings
            );
        }

        private bool TakeFirst(GraphTraversal g)
        {
            var (needOne, outMany) = g.Steps.Aggregate((false, false), (b, s) =>
                {
                    var (many, result) = b;
                    return (s is Out o && o.Many || many, s is Out || result);
                }
            );

            return outMany && !needOne;
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

        private Expression GetExpression(Expression param, GraphTraversal traversal,
            IEnumerable<(string name, Expression result)> mappings)
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

                    var q = SelectManyStep.GetSelectManyExpression(Graph, o);
                    return (ReplaceVisitor.VisitAndConvert(q.Body, q.Parameters[0], x), m);
                }

                if (step is Values values)
                {
                    Expression<Func<Vertex, object>> mx = v => ValuesQuery.GetMember(v, values.Name, values.Type);
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
                    if (x.Type == typeof(Vertex))
                    {
                        var notNullX = Expression.NotEqual(x, Expression.Constant(null));
                        var andX = Expression.And(notNullX, ReplaceVisitor.VisitAndConvert(p.Body, p.Parameters[0], x));

                        return (andX, m);
                        // return (ReplaceVisitor.VisitAndConvert(mx.Body, mx.Parameters[0], x), m);
                    }
                    else
                    {
                        var whereMethod = QueryableHelper.Where_TSource_1<Vertex>();
                        return (Expression.Call(whereMethod, x, p), m);
                    }
                }

                if (step is Select select)
                {
                    return (m.Select(select.Label), m);
                }

                if (step is Project project)
                {
                    return (GetProjectionExpression(x, project, m), m);
                }

                //if (step is First)
                //{
                //    var elementType = x.Type.GetItemType();
                //    var firstMethod = EnumerableHelper.FirstOrDefault(elementType);
                //    return (Expression.Call(firstMethod, x), m);
                //}

                throw new NotImplementedException(step.GetType().ToString());
            });

            return body.input;
        }

        private Expression<Func<Vertex, bool>> GetPropertyPredicate(string propertyName, IStep compareStep)
        {
            if (compareStep is Eq eq)
                if (eq.Value is Const cons)
                {
                    if (propertyName.Equals("id", StringComparison.InvariantCultureIgnoreCase))
                        return v => v != null && v.Id.Equals(cons.Value);
                    else
                        return v => v != null && v.Properties.Any(p =>
                            p.Name.Equals(propertyName, StringComparison.InvariantCultureIgnoreCase) &&
                            p.Value.Equals(cons.Value));
                }

            throw new NotImplementedException();
        }
    }

    internal class MemberStep
    {
        public static AnonymousQuery Query(Graph graph, LambdaExpression selectorExpr, Expression sourceExpr)
        {
            var sourceType = selectorExpr.Parameters[0].Type;
            var resultType = selectorExpr.Body.Type.GetItemType();
            var manyMethod = QueryableHelper.SelectMany_TSource_2(sourceType, resultType);

            var body = ToEnumerable(selectorExpr.Body);

            var many = Expression.Call(manyMethod, sourceExpr, Expression.Lambda(body, selectorExpr.Parameters));
            return new AnonymousQuery(graph, many);
        }

        private static Expression ToEnumerable(Expression expr)
        {
            var enumerableType = typeof(IEnumerable<>).MapFrom(expr.Type);
            if (enumerableType == expr.Type)
                return expr;

            return Expression.Convert(expr, enumerableType);
        }
    }

    internal class SelectManyStep
    {
        public static IGraphQuery Query(Graph graph, Out @out, Expression sourceExpr)
        {
            var _selectorExpr = GetSelectManyExpression(graph, @out);

            var sourceType = _selectorExpr.Parameters[0].Type;
            var resultType = _selectorExpr.Body.Type.GetItemType();
            var manyMethod = QueryableHelper.SelectMany_TSource_2(sourceType, resultType);

            var body = ToEnumerable(_selectorExpr.Body);

            var many = Expression.Call(manyMethod, sourceExpr, Expression.Lambda(body, _selectorExpr.Parameters));
            return new VertexQuery(graph, many);
        }

        public static Expression<Func<Vertex, IEnumerable<Vertex>>> GetSelectManyExpression(Graph graph, Out @out)
        {
            return v =>
                from edge in graph.Edges
                where edge.OutV.Equals(v.Id, StringComparison.InvariantCultureIgnoreCase) &&
                      edge.Label.Equals(@out.EdgeLabel, StringComparison.InvariantCultureIgnoreCase)
                join vertex in graph.Vertices on edge.InV equals vertex.Id
                select vertex;
        }

        private static Expression ToEnumerable(Expression expr)
        {
            var enumerableType = typeof(IEnumerable<>).MapFrom(expr.Type);
            if (enumerableType == expr.Type)
                return expr;

            return Expression.Convert(expr, enumerableType);
        }
    }

    internal class ValuesQuery
    {
        public static object GetMember(object v, string name, Type memberType)
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
        private readonly Graph _graph;

        public AnonymousQuery(Graph graph, Expression sourceExpr)
        {
            _graph = graph;
            SourceExpression = sourceExpr;
        }

        public object Execute(Type elementType)
        {
            var func = Expression.Lambda(SourceExpression).Compile();
            var list = new List<object>();
            var result = func.DynamicInvoke();
            Console.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));

            var mapper = new Mapper(new VertexMappingResolver(_graph));

            foreach (var o in (IEnumerable<object>) result)
            {
                list.Add(mapper.MapTo(o, elementType));
            }

            return list;
        }

        public IGraphQuery Next(Type sourceType, IStep step, IEnumerable<(string name, Expression result)> mappings)
        {
            if (step is Out o)
            {
                return SelectProperty(sourceType, o.EdgeLabel);
            }
            if (step is Values val)
            {
                return SelectProperty(sourceType, val.Name);
            }

            throw new NotSupportedException($"{step.GetType()}");
        }

        private IGraphQuery SelectProperty(Type sourceType, string propertyName)
        {
            var property = TypeDescriptor.GetProperties(sourceType)
                .OfType<PropertyDescriptor>()
                .First(p => p.Name.Equals(propertyName, StringComparison.InvariantCultureIgnoreCase));

            var param = Expression.Parameter(sourceType);
            var propertyExpr = Expression.Property(param, property.Name);

            return MemberStep.Query(_graph, Expression.Lambda(propertyExpr, param), SourceExpression);
        }

        public Expression SourceExpression { get; }
    }

    public interface IGraphQuery
    {
        object Execute(Type elementType);
        IGraphQuery Next(Type sourceType, IStep step, IEnumerable<(string name, Expression result)> mappings);
        Expression SourceExpression { get; }
    }

    internal class ShallowProxy : RealProxy
    {
        private readonly object _id;

        [PermissionSet(SecurityAction.LinkDemand)]
        public ShallowProxy(Type myType, object id) : base(myType)
        {
            _id = id;
        }

        [SecurityPermission(SecurityAction.LinkDemand, Flags = SecurityPermissionFlag.Infrastructure)]
        public override IMessage Invoke(IMessage myIMessage)
        {
            if (myIMessage is IMethodCallMessage methodCall)
            {
                if (methodCall.MethodName.Equals("GetType"))
                    return new ReturnMessage(typeof(ShallowProxy), null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("get_Id", StringComparison.OrdinalIgnoreCase))
                    return new ReturnMessage(_id, null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("ToString"))
                    return new ReturnMessage(ToString(), null, 0, methodCall.LogicalCallContext, methodCall);
            }

            throw new InvalidOperationException("Cannot call shallow object");
        }

        public override string ToString()
        {
            return $"{{Id: {_id}}}";
        }
    }
}