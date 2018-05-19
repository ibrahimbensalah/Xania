using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Newtonsoft.Json;
using Xania.Graphs.Structure;
using Xania.ObjectMapper;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
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
                    Console.WriteLine(JsonConvert.SerializeObject(entry, Formatting.Indented));
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
                        .Select(p => MappableVertex.ToClType(p.Value).Convert(propertyType));

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

                    var whereMethod = QueryableHelper.Where_TSource_1<Vertex>();
                    return (Expression.Call(whereMethod, x, p), m);
                }

                var list = m.ToArray();
                if (step is Select select)
                {
                    return (list.Select(select.Label), list);
                }

                if (step is Project project)
                {
                    return (GetProjectionExpression(x, project, list), list);
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
                    {
                        var id = cons.Value.ToString();
                        return v => v != null && v.Id.Equals(id);
                    }

                    var vertX = Expression.Parameter(typeof(Vertex));
                    return Expression.And(
                        vertX.NotNull(),
                        vertX.Property(nameof(Vertex.Properties))
                            .Where<Property>(e => e.Name.Equals(propertyName, StringComparison.InvariantCultureIgnoreCase))
                            .Select<Property, GraphValue>(e => e.Value)
                            .OfType<GraphPrimitive>()
                            .Any<GraphPrimitive>(gp => Equals(gp.Value, cons.Value))
                    ).ToLambda<Func<Vertex, bool>>(vertX);
                }

            throw new NotImplementedException();
        }
    }
}