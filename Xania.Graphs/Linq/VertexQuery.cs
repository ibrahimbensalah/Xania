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

            var mapper = new Mapper(new GraphMappingResolver(Graph));

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

            return mapper.MapTo(result, elementType);
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
                var v = Expression.Parameter(typeof(Vertex), "e");
                return FilterStep(v.NotNull().And(v.Property(nameof(Vertex.Label)).StringEqual(vertex.Label))
                    .ToLambda<Func<Vertex, bool>>(v));
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
                var param = Expression.Parameter(typeof(Vertex), "e");
                var projectionExpression = GetProjectionExpression(param, project, mappings);
                var selectorExpr = Expression.Lambda(projectionExpression, param);

                var selectMethod = QueryableHelper.Select_TSource_2(param.Type, selectorExpr.Body.Type);
                var anoExpr = Expression.Call(selectMethod, SourceExpression, selectorExpr);

                return new AnonymousQuery(Graph, anoExpr);
            }

            if (step is Values values)
            {
                var propertyNames = values.Name.Split('.');
                var propertyName = propertyNames.First();
                if (propertyName.Equals("id", StringComparison.InvariantCultureIgnoreCase))
                {
                    return new AnonymousQuery(Graph, SourceExpression.Select((Vertex v) => v.Id));
                }
                else
                {
                    var paramVertex = Expression.Parameter(typeof(Vertex), "e");
                    var valueSelectorExpr =
                        propertyNames.Skip(1).Aggregate(
                            paramVertex.Property(nameof(Vertex.Properties))
                                .Where<Property>(p => p.Property(nameof(Property.Name)).StringEqual(propertyName))
                                .Select((Property p) => p.Value)
                            ,
                            (propertyValues, memberName) =>
                                propertyValues
                                    .OfType<GraphObject>()
                                    .SelectMany((GraphObject o) => o.Properties)
                                    .Where<Property>(p =>
                                        p.Property(nameof(Property.Name)).StringEqual(memberName))
                                    .Select((Property p) => p.Value)
                        ).OfType<GraphList>().SelectMany((GraphList x) => x.Items);

                    return new ValuesQuery(Graph, SourceExpression.SelectMany(paramVertex, valueSelectorExpr));
                }
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
            ParameterExpression param = Expression.Parameter(typeof(Vertex), "e");
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

                        var v = Expression.Parameter(typeof(Vertex), "e");
                        return v.NotNull().And(v.Property(nameof(Vertex.Id)).StringEqual(id)).ToLambda<Func<Vertex, bool>>(v);
                    }

                    var vertX = Expression.Parameter(typeof(Vertex), "e");
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