﻿using System;
using System.Collections;
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

            var q = new VertexQuery(_graph, Expression.Constant(_graph.Vertices)).Execute(
                traversal,
                new(string name, IGraphQuery result)[0]
            );

            return Task.FromResult((IEnumerable<object>) q.Execute(elementType));
        }
    }

    public class GraphSON : IEnumerable<KeyValuePair<string, object>>
    {
        public string Id { get; set; }
        public Dictionary<string, object> Properties { get; set; }
        public IEnumerable<Edge> Relations { get; set; }

        public bool TryGetValue(string name, out object value)
        {
            if (name.Equals("id", StringComparison.InvariantCultureIgnoreCase))
            {
                value = Id;
                return true;
            }

            if (Properties.TryGetValue(name, out value))
                return true;


            return false;
        }

        public IEnumerator<KeyValuePair<string, object>> GetEnumerator()
        {
            yield return new KeyValuePair<string, object>("id", Id);

            foreach (var p in Properties)
                yield return new KeyValuePair<string, object>(p.Key, p.Value);

            foreach (var edge in Relations)
                yield return new KeyValuePair<string, object>(edge.Label, new Func<Type, object>(t =>
                {
                    if (t.IsEnumerable())
                    {
                        var itemType = t.GetItemType();
                        return new[] {Proxy(itemType, edge.InV)};
                    }

                    return Proxy(t, edge.InV);
                }));
        }

        private static object Proxy(Type modelType, object targetId)
        {
            var relModelProperties = TypeDescriptor.GetProperties(modelType)
                .OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;

            var id = relIdProperty == null ? null : targetId.Convert(relIdProperty.PropertyType);

            return new ShallowProxy(modelType, id).GetTransparentProxy();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
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
            // var graphsonExpr = GetGraphSONExpression(Graph.Edges, SourceExpression);

            var f = Expression.Lambda(SourceExpression).Compile();
            var result = f.DynamicInvoke();

            var mapper = new Mapper(new VertexMappingResolver(Graph));

            if (result is IEnumerable<Vertex> enumerable)
            {
                var list = new List<object>();

                foreach (var entry in enumerable)
                {
                    var entity = mapper.MapTo(entry, elementType);
                    // var entity = elementType.CreateInstance(entry);
                    list.Add(entity);
                }

                return list;
            }
            else
            {
                return mapper.MapTo(result, elementType);
            }

            //var f = Expression.Lambda<Func<IQueryable<Vertex>>>(Expression).Compile();
            //return f().Select(v => v.ToClrType(elementType, _graph));
        }

        //public static Expression GetGraphSONExpression(IQueryable<Edge> edges, Expression sourceExpression)
        //{
        //    Expression<Func<Vertex, GraphSON>> propertiesExpr =
        //        v => new GraphSON
        //        {
        //            Id = v.Id,
        //            Properties =
        //                v.Properties.ToDictionary(p => p.Name, p => p.Value, StringComparer.InvariantCultureIgnoreCase),
        //            Relations = edges.Where(edge => edge.OutV == v.Id)
        //        };

        //    var selectMethod = QueryableHelper.Select_TSource_2(typeof(Vertex), typeof(GraphSON));
        //    return Expression.Call(selectMethod, sourceExpression, propertiesExpr);
        //}

        public static Expression GetVertextExpression(Type elementType)
        {
            return Expression.New(elementType);
        }

        public IGraphQuery Next(Type sourceType, IStep step)
        {
            if (step is V vertex)
            {
                return new FilterStep<Vertex>(Graph,
                        x => x != null && x.Label.Equals(vertex.Label, StringComparison.InvariantCultureIgnoreCase))
                    .Query(SourceExpression);
            }

            if (step is Has has)
            {
                return new FilterStep<Vertex>(Graph, GetPropertyPredicate(has.Property, has.CompareStep)).Query(
                    SourceExpression);
            }

            if (step is Where where)
            {
                return new FilterStep<Vertex>(Graph,
                        GetVertexPredicate(@where.Predicate, new(string name, Expression result)[0]))
                    .Query(SourceExpression);
            }

            if (step is Out @out)
            {
                return new SelectManyStep(Graph, @out).Query(SourceExpression);
            }

            if (step is Project project)
            {
                var param = Expression.Parameter(typeof(Vertex));
                var listInit = GetProjectionExpression(param, project);
                return new SelectStep(Graph, Expression.Lambda(listInit, param)).Query(SourceExpression);
            }

            if (step is Values values)
            {
                return new ValuesStep(Graph, values.Name, values.Type).Query(SourceExpression);
            }

            throw new NotImplementedException($"VertextQuery.Execute {step.GetType()}");
        }

        private Expression GetProjectionExpression(Expression param, Project project)
        {
            var addMethod = typeof(Dictionary<string, object>).GetMethod("Add");

            var bindings = project.Dict.Select(
                kvp =>
                {
                    // var x = g.Execute(kvp.Value, new(string name, IGraphQuery result)[0]);
                    var expr = GetExpression(param, kvp.Value, new(string name, Expression result)[0]);

                    if (TakeFirst(kvp.Value))
                    {
                        var elementType = expr.Type.GetItemType();
                        var firstMethod = EnumerableHelper.FirstOrDefault(elementType);
                        expr = Expression.Call(firstMethod, expr);
                    }

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
                    return (GetProjectionExpression(x, project), m);
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
        public Type TargetType { get; }

        public SelectManyStep(Graph graph, LambdaExpression selectorExpr, Type type)
        {
            _graph = graph;
            _selectorExpr = selectorExpr;
            TargetType = type;
        }

        public SelectManyStep(Graph graph, Out @out)
            : this(graph, GetSelectManyExpression(graph, @out), @out.Type)
        {
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

        public IGraphQuery Next(Type sourceType, IStep step)
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

            return new MemberStep(_graph, Expression.Lambda(propertyExpr, param)).Query(SourceExpression);
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