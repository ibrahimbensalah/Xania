using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
    public static class ExpressionFluentExtenstions
    {
        public static MemberExpression Property(this Expression expr, string name)
        {
            return Expression.Property(expr, name);
        }

        public static UnaryExpression As<T>(this Expression expr)
        {
            return Expression.Convert(expr, typeof(T));
        }

        public static MethodInfo s_Equals_2 = new Func<object, object, bool>(Equals).GetMethodInfo();
        public static MethodInfo s_StringEquals_3 = new Func<string, string, StringComparison, bool>(string.Equals).GetMethodInfo();

        public static Expression StringEqual(this Expression expr, string value)
        {
            return Expression.Call(s_StringEquals_3, expr, Expression.Constant(value), Expression.Constant(StringComparison.InvariantCultureIgnoreCase));
        }

        public static Expression Equal(this Expression expr, object value)
        {
            return Expression.Call(s_Equals_2, expr, Expression.Constant(value));
        }

        public static Expression And(this Expression expr1, Expression expr2)
        {
            return Expression.And(expr1, expr2);
        }

        public static Expression<TDelegate> ToLambda<TDelegate>(this Expression body, params ParameterExpression[] parameters)
        {
            return Expression.Lambda<TDelegate>(body, parameters);
        }

        public static Expression NotNull(this Expression expr)
        {
            return Expression.NotEqual(expr, Expression.Constant(null));
        }

        public static Expression Where<TSource>(this Expression sourceExpr, Expression<Func<TSource, bool>> predicateExpr)
        {
            return Where(sourceExpr, predicateExpr as LambdaExpression);
        }

        public static Expression Where<TSource>(this Expression sourceExpr, Func<ParameterExpression, Expression> predicateExpr)
        {
            var parameter = Expression.Parameter(typeof(TSource));
            return Where(sourceExpr, Expression.Lambda(predicateExpr(parameter), parameter));
        }

        public static Expression Where(this Expression sourceExpr, LambdaExpression predicateExpr)
        {
            var sourceType = sourceExpr.Type.GetItemType();

            if (typeof(IQueryable<>).MakeGenericType(sourceType).IsAssignableFrom(sourceExpr.Type))
            {
                var methodInfo = QueryableHelper.Where_TSource_1(sourceType);
                return Expression.Call(methodInfo, sourceExpr, predicateExpr);
            }
            else
            {
                var methodInfo = EnumerableHelper.Where_TSource_1(sourceType);
                return Expression.Call(methodInfo, sourceExpr, predicateExpr);
            }
        }

        public static Expression Any<TSource>(this Expression expr, Expression<Func<TSource, bool>> predicate)
        {
            var methodInfo = EnumerableHelper.Any_TSource_1<TSource>();
            return Expression.Call(methodInfo, expr, predicate);
        }

        public static Expression Select(this Expression sourceExpression, string propertyName)
        {
            var sourceType = sourceExpression.Type.GetItemType();
            var paramExpr = Expression.Parameter(sourceType);
            var selectorExpr = Expression.Property(paramExpr, propertyName);

            var resultType = selectorExpr.Type;

            var methodInfo = EnumerableHelper.Select_TSource_2(sourceType, resultType);
            return Expression.Call(methodInfo, sourceExpression, Expression.Lambda(selectorExpr, paramExpr));
        }

        public static Expression Select<TSource, TResult>(this Expression sourceExpression, Expression<Func<TSource, TResult>> selectorLambda)
        {
            var methodInfo = EnumerableHelper.Select_TSource_2<TSource, TResult>();
            return Expression.Call(methodInfo, sourceExpression, selectorLambda);
        }

        public static Expression OfType<T>(this Expression sourceExpression)
        {
            var methodInfo = typeof(IQueryable).IsAssignableFrom(sourceExpression.Type)
                    ? QueryableHelper.OfType_TSource_1(typeof(T))
                    : EnumerableHelper.OfType_TSource_1(typeof(T))
                ;

            return Expression.Call(methodInfo, sourceExpression);
        }

        public static Expression SelectMany<TSource, TResult>(this Expression sourceExpression, Expression<Func<TSource, IEnumerable<TResult>>> selectorLambda)
        {
            var methodInfo = EnumerableHelper.SelectMany_TSource_2<TSource, TResult>();
            return Expression.Call(methodInfo, sourceExpression, selectorLambda);
        }

        public static Expression SelectMany(this Expression sourceExpression, ParameterExpression paramExpression,
            Expression collectorExpression)
        {
            var methodInfo = QueryableHelper.SelectMany_TSource_2(paramExpression.Type, collectorExpression.Type.GetItemType());
            return Expression.Call(methodInfo, sourceExpression, Expression.Lambda(collectorExpression, paramExpression));
        }
    }
}
