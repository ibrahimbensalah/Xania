using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.Remoting.Messaging;
using System.Runtime.Remoting.Proxies;
using System.Security.Permissions;
using System.Threading.Tasks;
using Xania.Graphs;
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
                new(string name, IGraphQuery result)[0]
            );

            return Task.FromResult((IEnumerable<object>) q.Execute(elementType));
        }
    }

    public class GraphSON : IDictionary<string, Func<Type, object>>
    {
        public string Id { get; set; }
        public Dictionary<string, object> Properties { get; set; }
        public IEnumerable<Edge> Relations { get; set; }

        public IEnumerator<KeyValuePair<string, Func<Type, object>>> GetEnumerator()
        {
            yield return new KeyValuePair<string, Func<Type, object>>("id", t => Id.Convert(t));

            foreach (var p in Properties)
                yield return new KeyValuePair<string, Func<Type, object>>(p.Key, t => p.Value.Convert(t));

            foreach (var edge in Relations)
                yield return new KeyValuePair<string, Func<Type, object>>(edge.Label, t =>
                {
                    if (t.IsEnumerable())
                    {
                        var itemType = t.GetItemType();
                        return new[] {Proxy(itemType, edge.InV)};
                    }

                    return Proxy(t, edge.InV);
                });
        }

        private static object Proxy(Type modelType, object targetId)
        {
            var relModelProperties = TypeDescriptor.GetProperties(modelType)
                .OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;

            var id = relIdProperty == null ? null : targetId.Convert(relIdProperty?.PropertyType);

            return new ShallowProxy(modelType, id).GetTransparentProxy();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public void Add(KeyValuePair<string, Func<Type, object>> item)
        {
            throw new NotImplementedException();
        }

        public void Clear()
        {
            throw new NotImplementedException();
        }

        public bool Contains(KeyValuePair<string, Func<Type, object>> item)
        {
            throw new NotImplementedException();
        }

        public void CopyTo(KeyValuePair<string, Func<Type, object>>[] array, int arrayIndex)
        {
            throw new NotImplementedException();
        }

        public bool Remove(KeyValuePair<string, Func<Type, object>> item)
        {
            throw new NotImplementedException();
        }

        public int Count { get; }
        public bool IsReadOnly { get; }

        public bool ContainsKey(string key)
        {
            throw new NotImplementedException();
        }

        public void Add(string key, Func<Type, object> value)
        {
            throw new NotImplementedException();
        }

        public bool Remove(string key)
        {
            throw new NotImplementedException();
        }

        public bool TryGetValue(string key, out Func<Type, object> value)
        {
            foreach (var kvp in this)
                if (kvp.Key.Equals(key, StringComparison.InvariantCultureIgnoreCase))
                {
                    value = kvp.Value;
                    return true;
                }

            value = null;
            return false;
        }

        public Func<Type, object> this[string key]
        {
            get { throw new NotImplementedException(); }
            set { throw new NotImplementedException(); }
        }

        public ICollection<string> Keys { get; }
        public ICollection<Func<Type, object>> Values { get; }
    }

    internal class VertexQuery : IGraphQuery
    {
        private readonly Graph _graph;
        public Expression SourceExpression { get; }

        public VertexQuery(Graph graph, Expression expr)
        {
            _graph = graph;
            SourceExpression = expr;
        }

        public object Execute(Type elementType)
        {
            var graphsonExpr = GetGraphSONExpression();

            var f = Expression.Lambda(graphsonExpr).Compile();
            var result = (IEnumerable<GraphSON>) f.DynamicInvoke();

            var list = new List<object>();

            foreach (var entry in result)
            {
                var entity = elementType.CreateInstance(entry);
                list.Add(entity);
            }

            return list;

            //var f = Expression.Lambda<Func<IQueryable<Vertex>>>(Expression).Compile();
            //return f().Select(v => v.ToClrType(elementType, _graph));
        }

        public Expression GetGraphSONExpression()
        {
            Expression<Func<Vertex, GraphSON>> propertiesExpr =
                v => new GraphSON
                {
                    Id = v.Id,
                    Properties =
                        v.Properties.ToDictionary(p => p.Name, p => p.Value, StringComparer.InvariantCultureIgnoreCase),
                    Relations = _graph.Edges.Where(edge => edge.OutV == v.Id)
                };

            var selectMethod = QueryableHelper.Select_TSource_2(typeof(Vertex), typeof(GraphSON));
            var graphsonExpr = Expression.Call(selectMethod, SourceExpression, propertiesExpr);
            return graphsonExpr;
        }

        public static Expression GetVertextExpression(Type elementType)
        {
            var vertexParam = Expression.Parameter(typeof(Vertex));

            return Expression.New(elementType);
        }

        public IGraphQuery Next(Type sourceType, IStep step)
        {
            if (step is V vertex)
            {
                return new FilterStep<Vertex>(_graph,
                        x => x.Label.Equals(vertex.Label, StringComparison.InvariantCultureIgnoreCase))
                    .Query(SourceExpression);
            }

            if (step is Has has)
            {
                return new FilterStep<Vertex>(_graph, GetPropertyPredicate(has.Property, has.CompareStep)).Query(
                    SourceExpression);
            }

            if (step is Where where)
            {
                return new FilterStep<Vertex>(_graph,
                        GetVertexPredicate(@where.Predicate, new(string name, Expression result)[0]))
                    .Query(SourceExpression);
            }

            if (step is Out @out)
            {
                return new SelectManyStep(_graph, @out).Query(SourceExpression);
            }

            if (step is Project project)
            {
                var param = Expression.Parameter(typeof(Vertex));
                var listInit = GetProjectionExpression(param, project);
                return new SelectStep(_graph, Expression.Lambda(listInit, param)).Query(SourceExpression);
            }

            if (step is Values values)
            {
                return new ValuesStep(_graph, values.Name, values.Type).Query(SourceExpression);
            }

            throw new NotImplementedException($"VertextQuery.Execute {step.GetType()}");
        }

        private Expression GetProjectionExpression(Expression param, Project project)
        {
            var g = new LocalQuery(_graph, param);
            var addMethod = typeof(Dictionary<string, object>).GetMethod("Add");

            var bindings = project.Dict.Select(
                kvp =>
                {

                    var x = g.Execute(kvp.Value, new(string name, IGraphQuery result)[0]);
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

                    var q = SelectManyStep.GetOutExpression(_graph, o);

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

    internal class LocalQuery : IGraphQuery
    {
        public LocalQuery(Graph graph, Expression sourceExpression)
        {
            Graph = graph;
            SourceExpression = sourceExpression;
        }

        public object Execute(Type elementType)
        {
            throw new NotImplementedException();
        }

        public IGraphQuery Next(Type sourceType, IStep step)
        {
            if (step is Values values)
            {
                return new ValuesStep(Graph, values.Name, values.Type).Local(SourceExpression);
            }

            if (step is Out @out)
            {
                return new SelectManyStep(Graph, @out).Local(SourceExpression);
            }

            throw new NotImplementedException($"Next {step}");
        }

        public Graph Graph { get; }
        public Expression SourceExpression { get; }
    }

    internal class LocalStep : IStepQuery
    {
        public Expression Expression { get; }

        public LocalStep(Expression expression)
        {
            Expression = expression;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            throw new NotImplementedException();
        }

        public IGraphQuery Local(Expression sourceExpr)
        {
            throw new NotImplementedException();
        }
    }

    internal class ValuesStep : IStepQuery
    {
        public Graph Graph { get; }
        public string PropertyName { get; }
        public Type PropertyType { get; }

        public ValuesStep(Graph graph, string propertyName, Type propertyType)
        {
            Graph = graph;
            PropertyName = propertyName;
            PropertyType = propertyType;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            Expression<Action<Vertex>> query =
                v => v.Properties.Where(p => p.Name.Equals(PropertyName, StringComparison.InvariantCultureIgnoreCase))
                    .Select(p => p.Value.Convert(PropertyType));

            var param = Expression.Parameter(typeof(Object));
            var selectExpr = Expression.Call(
                EnumerableHelper.Select_TSource_2(typeof(Object), PropertyType),
                query.Body,
                Expression.Lambda(Expression.Convert(param, PropertyType), param)
            );

            var firstMethod = EnumerableHelper.FirstOrDefault(PropertyType);
            var selectorExpr = Expression.Lambda(Expression.Call(firstMethod, selectExpr), query.Parameters);
            var sourceType = sourceExpr.Type.GetItemType();
            var selectMethod = QueryableHelper.Select_TSource_2(sourceType, selectorExpr.Body.Type);
            var anoExpr = Expression.Call(selectMethod, sourceExpr, selectorExpr);

            return new AnonymousQuery(Graph, anoExpr);
        }

        public IGraphQuery Local(Expression sourceExpr)
        {
            Expression<Action<Vertex>> query =
                v => v.Properties.Where(p => p.Name.Equals(PropertyName, StringComparison.InvariantCultureIgnoreCase))
                    .Select(p => p.Value.Convert(PropertyType)).FirstOrDefault();


            var selectBody = new ReplaceVisitor(query.Parameters[0], sourceExpr).VisitAndConvert(query.Body);
            return new LocalQuery(Graph, selectBody);
        }
    }

    internal class SelectStep : IStepQuery
    {
        private readonly Graph _graph;
        private readonly LambdaExpression _selectorExpr;

        public SelectStep(Graph graph, LambdaExpression selectorExpr)
        {
            _graph = graph;
            _selectorExpr = selectorExpr;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            var sourceType = sourceExpr.Type.GetItemType();
            var selectMethod = QueryableHelper.Select_TSource_2(sourceType, _selectorExpr.Body.Type);
            var anoExpr = Expression.Call(selectMethod, sourceExpr, _selectorExpr);

            return new AnonymousQuery(_graph, anoExpr);
        }

        public IGraphQuery Local(Expression sourceExpr)
        {
            throw new NotImplementedException();
        }
    }

    internal class MemberStep : IStepQuery
    {
        private readonly Graph _graph;
        private readonly LambdaExpression _selectorExpr;

        public MemberStep(Graph graph, LambdaExpression selectorExpr)
        {
            _graph = graph;
            _selectorExpr = selectorExpr;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            var sourceType = _selectorExpr.Parameters[0].Type;
            var resultType = _selectorExpr.Body.Type.GetItemType();
            var manyMethod = QueryableHelper.SelectMany_TSource_2(sourceType, resultType);

            var body = ToEnumerable(_selectorExpr.Body);

            var many = Expression.Call(manyMethod, sourceExpr, Expression.Lambda(body, _selectorExpr.Parameters));
            return new AnonymousQuery(_graph, many);
        }

        public IGraphQuery Local(Expression sourceExpr)
        {
            throw new NotImplementedException();
        }

        private Expression ToEnumerable(Expression expr)
        {
            var enumerableType = typeof(IEnumerable<>).MapFrom(expr.Type);
            if (enumerableType == expr.Type)
                return expr;

            return Expression.Convert(expr, enumerableType);
        }
    }

    internal class SelectManyStep : IStepQuery
    {
        private readonly Graph _graph;
        private readonly LambdaExpression _selectorExpr;

        public SelectManyStep(Graph graph, LambdaExpression selectorExpr)
        {
            _graph = graph;
            _selectorExpr = selectorExpr;
        }

        public SelectManyStep(Graph graph, Out @out)
            : this(graph, GetOutExpression(graph, @out))
        {
        }

        public static Expression<Func<Vertex, IEnumerable<Vertex>>> GetOutExpression(Graph graph, Out @out)
        {
            return v =>
                from edge in graph.Edges
                where edge.OutV.Equals(v.Id, StringComparison.InvariantCultureIgnoreCase) &&
                      edge.Label.Equals(@out.EdgeLabel, StringComparison.InvariantCultureIgnoreCase)
                join vertex in graph.Vertices on edge.InV equals vertex.Id
                select vertex;
        }

        public IGraphQuery Query(Expression sourceExpr)
        {
            var sourceType = _selectorExpr.Parameters[0].Type;
            var resultType = _selectorExpr.Body.Type.GetItemType();
            var manyMethod = QueryableHelper.SelectMany_TSource_2(sourceType, resultType);

            var body = ToEnumerable(_selectorExpr.Body);

            var many = Expression.Call(manyMethod, sourceExpr, Expression.Lambda(body, _selectorExpr.Parameters));
            return new VertexQuery(_graph, many);
        }

        public IGraphQuery Local(Expression sourceExpr)
        {
            var param = _selectorExpr.Parameters[0];
            var localExpr = new ReplaceVisitor(param, sourceExpr).VisitAndConvert(_selectorExpr.Body);
            return new VertexQuery(_graph, localExpr);
        }

        private Expression ToEnumerable(Expression expr)
        {
            var enumerableType = typeof(IEnumerable<>).MapFrom(expr.Type);
            if (enumerableType == expr.Type)
                return expr;

            return Expression.Convert(expr, enumerableType);
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

        public IGraphQuery Local(Expression sourceExpr)
        {
            throw new NotImplementedException();
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
            var result = Expression.Lambda(SourceExpression).Compile();
            var list = new List<object>();
            foreach (var o in (IEnumerable<object>) result.DynamicInvoke())
            {
                list.Add(o.Convert(elementType));
            }

            return list;
        }

        public IGraphQuery Next(Type sourceType, IStep step)
        {
            if (step is Out o)
            {
                var property = TypeDescriptor.GetProperties(sourceType)
                    .OfType<PropertyDescriptor>()
                    .First(p => p.Name.Equals(o.EdgeLabel, StringComparison.InvariantCultureIgnoreCase));

                var param = Expression.Parameter(sourceType);
                var propertyExpr = Expression.Property(param, property.Name);

                return new MemberStep(_graph, Expression.Lambda(propertyExpr, param)).Query(SourceExpression);
            }

            throw new NotSupportedException($"{step.GetType()}");
        }

        public Expression SourceExpression { get; }
    }


    public interface IGraphQuery
    {
        object Execute(Type elementType);
        IGraphQuery Next(Type sourceType, IStep step);
        Expression SourceExpression { get; }
    }

    public interface IStepQuery
    {
        IGraphQuery Query(Expression sourceExpr);
        IGraphQuery Local(Expression sourceExpr);
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
            if (myIMessage is IMethodCallMessage)
            {
                var methodCall = (IMethodCallMessage) myIMessage;
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