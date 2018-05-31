using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Newtonsoft.Json;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
    public static class ExpressionFluentExtenstions
    {
        public static UnaryExpression Quote(this Expression expression)
        {
            return Expression.Quote(expression);
        }

        public static MemberExpression Property(this Expression expr, string name)
        {
            return Expression.Property(expr, name);
        }

        public static MethodInfo s_Convert_1 = new Func<string, int>(Convert<string, int>).GetMethodInfo().GetGenericMethodDefinition();
        public static Expression Convert(this Expression expr, Type type)
        {
            if (expr.Type == type)
                return expr;

            var methodInfo = s_Convert_1.MakeGenericMethod(expr.Type, type);
            return Expression.Call(methodInfo, expr);
        }

        private static TR Convert<TI, TR>(this TI value)
        {
            var inputConverter = TypeDescriptor.GetConverter(typeof(TI));
            if (inputConverter.CanConvertTo(typeof(TR)))
            {
                return (TR)inputConverter.ConvertTo(value, typeof(TR));
            }

            var resultConverter = TypeDescriptor.GetConverter(typeof(TR));
            if (resultConverter.CanConvertFrom(typeof(TI)))
            {
                return (TR)resultConverter.ConvertFrom(value);
            }

            return default(TR);
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

        public static Expression StringEqual(this Expression expr, Expression valueExpr)
        {
            return Expression.Call(s_StringEquals_3, expr, valueExpr, Expression.Constant(StringComparison.InvariantCultureIgnoreCase));
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

        public static Expression Select(this Expression sourceExpression, LambdaExpression selectorLambda)
        {
            var resultType = selectorLambda.Body.Type;

            var queryableType = typeof(IQueryable<>).MapFrom(sourceExpression.Type);
            if (queryableType != null)
            {
                var sourceType = queryableType.GenericTypeArguments[0];
                var methodInfo = QueryableHelper.Select_TSource_2(sourceType, resultType);
                return Expression.Call(methodInfo, sourceExpression, selectorLambda);
            }

            var enumerableType = typeof(IEnumerable<>).MapFrom(sourceExpression.Type);
            if (enumerableType != null)
            {
                var sourceType = enumerableType.GenericTypeArguments[0];
                var methodInfo = EnumerableHelper.Select_TSource_2(sourceType, resultType);
                return Expression.Call(methodInfo, sourceExpression, selectorLambda);
            }

            return ReplaceVisitor.VisitAndConvert(selectorLambda.Body, selectorLambda.Parameters[0],
                sourceExpression);
        }

        public static Expression Select<TSource, TResult>(this Expression sourceExpression, Expression<Func<TSource, TResult>> selectorLambda)
        {
            var sourceType = sourceExpression.Type;
            if (sourceType == typeof(TSource))
            {
                return ReplaceVisitor.VisitAndConvert(selectorLambda.Body, selectorLambda.Parameters[0],
                    sourceExpression);
            }

            var queryableType = typeof(IQueryable<>).MapFrom(sourceType);
            if (queryableType != null)
            {
                var methodInfo = QueryableHelper.Select_TSource_2<TSource, TResult>();
                return Expression.Call(methodInfo, sourceExpression, selectorLambda);
            }

            var enumerableType = typeof(IEnumerable<>).MapFrom(sourceType);
            if (enumerableType != null)
            {
                var methodInfo = EnumerableHelper.Select_TSource_2<TSource, TResult>();
                return Expression.Call(methodInfo, sourceExpression, selectorLambda);
            }

            throw new InvalidOperationException($"Select <{sourceType.Name}, _>");
        }

        public static Expression Contains(this Expression sourceExpression, Expression valueExpression)
        {
            var methodInfo = EnumerableHelper.Contains_TSource_1(valueExpression.Type);
            return Expression.Call(methodInfo, sourceExpression, valueExpression);
        }

        public static Expression Debug(this Expression expr, string label)
        {
            var method = typeof(ExpressionFluentExtenstions).GetMethod(nameof(DebugValue));
            var debugMethod = method.MakeGenericMethod(expr.Type);
            return Expression.Call(debugMethod, expr, Expression.Constant(label));
        }

        public static T DebugValue<T>(T value, string label)
        {
            Console.WriteLine(label + ":\r\n==========================================");
            Console.WriteLine(JsonConvert.SerializeObject(value, Formatting.Indented));
            return value;
        }

        public static Expression OfType(this Expression sourceExpression, Type type)
        {
            var methodInfo = typeof(IQueryable).IsAssignableFrom(sourceExpression.Type)
                    ? QueryableHelper.OfType_TSource_1(type)
                    : EnumerableHelper.OfType_TSource_1(type)
                ;

            return Expression.Call(methodInfo, sourceExpression);
        }

        public static Expression OfType<T>(this Expression sourceExpression)
        {
            return OfType(sourceExpression, typeof(T));
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

        public static Expression Join(this Expression outerExpression, Expression innerExpression, Expression outerKeySelector, Expression innerKeySelector, Expression resultExpression)
        {
            var outerType = outerExpression.Type.GetItemType();
            var innerType = innerExpression.Type.GetItemType();
            var keyType = ((outerKeySelector as UnaryExpression)?.Operand as LambdaExpression ?? outerKeySelector as LambdaExpression)?.Body.Type;
            var resultType = ((resultExpression as UnaryExpression)?.Operand as LambdaExpression ?? resultExpression as LambdaExpression)?.Body.Type;

            var methodInfo = QueryableHelper.Join_TSource_4(outerType, innerType, keyType, resultType);
            return Expression.Call(methodInfo, outerExpression, innerExpression, outerKeySelector, innerKeySelector, resultExpression);
        }

        public static MethodInfo FindOverload(this Type declaringType, string methodName, params Type[] argTypes)
        {
            var overloads =
                    from m in declaringType.GetMethods()
                    where m.Name.Equals(methodName)
                    let paramTypes = m.GetParameters().Select(e => e.ParameterType).ToArray()
                    let match = InferTypeArguments(argTypes, paramTypes)
                    where match != null
                    orderby match?.level
                    select (m, match?.map)
                ;

            var first = overloads.FirstOrNull();
            if (first == null)
                return null;

            var methodInfo = first.Value.Item1;
            var genericArgs = first.Value.Item2;

            if (methodInfo.IsGenericMethod)
            {
                var types =
                    methodInfo
                        .GetGenericArguments()
                        .Select(a => genericArgs
                            .Where(e => e.genericType == a)
                            .Select(e => e.argType)
                            .First())
                        .ToArray();
                ;

                return methodInfo.MakeGenericMethod(types);
            }
            else
            {
                if (genericArgs.Any())
                    throw new InvalidOperationException("Non generic method is not expected to have generic arguments");
                return methodInfo;
            }
        }

        private static (int level, (Type genericType, Type argType)[] map)? InferTypeArguments(Type[] argTypes, Type[] genericTypes)
        {
            if (genericTypes.Length != argTypes.Length)
                return null;

            var inf = genericTypes.Select((genericType, idx) => argTypes[idx].InferTypeArguments(genericType));

            return inf.Aggregate((nx, ny) =>
            {
                if (nx == null || ny == null)
                    return null;

                var x = nx.Value;
                var y = ny.Value;

                var level = Math.Min(x.level, y.level);

                var map = x.map.Concat(y.map).Aggregate(
                    new(Type, Type)[0],
                    (acc, m) =>
                    {
                        if (acc == null)
                            return null;

                        var matches = (from p in acc where p.Item1 == m.genericType select p).ToArray();

                        if (!matches.Any())
                            return acc.Append(m).ToArray();

                        return matches.Any(e => e.Item2 != m.argType) ? null : acc;
                    }
                );

                if (map == null)
                    return null;

                return (level, map.ToArray());
            });
        }

        private static (int level, (Type, Type)[] map) empty = (0, new(Type, Type)[0]);

        public static (int level, (Type genericType, Type argType)[] map)? InferTypeArguments(this Type argType, Type genericType)
        {
            if (argType == null)
                return null;

            if (genericType == argType)
                return empty;

            if (genericType.IsGenericParameter)
                return (0, new[] { (genericType, argType) });

            if (genericType.ContainsGenericParameters && argType.IsGenericType)
            {
                if (argType.GetGenericTypeDefinition() == genericType.GetGenericTypeDefinition())
                {
                    var gtmap =
                            genericType.GenericTypeArguments
                                .Select((gt, idx) => InferTypeArguments(argType.GenericTypeArguments[idx], gt))
                                .NotNull()
                        ;

                    return gtmap.Aggregate(empty, (x, y) =>
                    {
                        var level = Math.Min(x.level, y.level);
                        var map = x.map.Concat(y.map).ToArray();

                        return (level, map);
                    });
                }
            }

            var matches = (
                from b in GetParentTypes(argType)
                let match = InferTypeArguments(b, genericType)
                where match != null
                orderby match?.level
                select match
            ).ToArray();

            var first = matches.FirstOrDefault();
            if (first == null)
                return null;

            return (1 + first.Value.level, first.Value.map);
        }

        private static IEnumerable<Type> GetParentTypes(Type type)
        {
            if (type.BaseType != null)
                yield return type.BaseType;

            foreach (var i in type.GetInterfaces().Except(type.BaseType?.GetInterfaces() ?? Enumerable.Empty<Type>()))
            {
                yield return i;
            }
        }

        private static IEnumerable<T> NotNull<T>(this IEnumerable<T?> enumerable)
            where T : struct
        {
            return enumerable.Where(e => e != null).Select(e => e.Value);
        }

        private static IEnumerable<T> NotNull<T>(this IEnumerable<T> enumerable)
            where T : class
        {
            return enumerable.Where(e => e != null);
        }

        private static T? FirstOrNull<T>(this IEnumerable<T> enumerable)
            where T : struct
        {
            var arr = enumerable.Take(1).ToArray();
            if (arr.Any()) return arr[0];
            return null;
        }
    }
}
