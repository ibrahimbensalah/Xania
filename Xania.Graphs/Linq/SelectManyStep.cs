using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Structure;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
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
}