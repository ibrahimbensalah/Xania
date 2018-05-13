using System.Collections.Generic;
using System.Linq.Expressions;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
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
}