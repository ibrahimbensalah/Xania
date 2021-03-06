﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.Graphs.Gremlin;
using Xania.Reflection;
using Xania.ObjectMapper;

namespace Xania.Graphs.Linq
{
    public class GremlinQueryProvider : IQueryProvider
    {
        private readonly IGraphDataContext _client;

        public GremlinQueryProvider(IGraphDataContext client)
        {
            _client = client;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            throw new NotImplementedException();
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new GenericQueryable<TElement>(this, expression);
        }

        public object Execute(Expression expression)
        {
            throw new NotImplementedException();
        }

        public TResult Execute<TResult>(Expression expression)
        {
            bool IsEnumerable = typeof(TResult).Name == "IEnumerable`1";
            var traversal = ToTraversal(expression);

            if (IsEnumerable)
            {
                var resultType = typeof(IQueryable<>).MapTo(typeof(TResult));
                var elementType = resultType.GenericTypeArguments[0];

                var items = _client.ExecuteAsync(traversal, elementType).Result.ToArray();
                return items.MapTo<TResult>();
                // return (TResult)resultType.CreateCollection(items.ToArray());
            }
            else
            {
                var result = _client.ExecuteAsync(traversal, typeof(TResult)).Result;
                if (result == null) return default(TResult);
                return result.MapTo<TResult>();
                // return (TResult)result.MapTo(typeof(TResult));
            }
        }

        private static class By
        {
            public static Func<IStep, bool> Select(string paramName)
            {
                return e => e is Select select && select.Label.Equals(paramName);
            }
        }

        public static GraphTraversal ToTraversal(Expression expression)
        {
            /**
             * Evaluate expression
             */
            var values = new Stack<GraphTraversal>();
            foreach (var oper in GetOperators(expression).Reverse())
            {
                var args = PopValues(values, oper.Item1).ToArray();
                var expr = oper.Item2(args);
                values.Push(expr);
            }

            return values.Single();
        }

        private static GraphTraversal[] PopValues(Stack<GraphTraversal> values, int operCount)
        {
            var arr = new GraphTraversal[operCount];
            for (var i = operCount - 1; i >= 0; i--)
            {
                arr[i] = values.Pop();
            }
            return arr;
        }

        private static IEnumerable<(int, Func<GraphTraversal[], GraphTraversal>)> GetOperators(Expression root)
        {
            var cache = new Dictionary<ParameterExpression, GraphTraversal>();
            var stack = new Stack<Expression>();
            Push(stack, root);
            while (stack.Count > 0)
            {
                var item = stack.Pop();
                if (item is MethodCallExpression methodCall)
                {
                    var methodName = methodCall.Method.Name;
                    if (methodName.Equals("Select") && methodCall.Arguments.Count == 2)
                    {
                        yield return Select(methodCall, stack);
                    }
                    else if (methodName.Equals("Where") && methodCall.Arguments.Count == 2)
                    {
                        yield return Where(methodCall, stack);
                    }
                    else if (methodName.Equals("SelectMany") && methodCall.Arguments.Count == 2)
                    {
                        yield return SelectMany2(methodCall, stack);
                    }
                    else if (methodName.Equals("SelectMany") && methodCall.Arguments.Count == 3)
                    {
                        yield return SelectMany3(methodCall, stack);
                    }
                    else if (methodName.Equals("OrderBy") && methodCall.Arguments.Count == 2)
                    {
                        yield return OrderBy(methodCall, stack);
                    }
                    else if (methodName.Equals("OrderByDescending") && methodCall.Arguments.Count == 2)
                    {
                        yield return OrderBy(methodCall, stack, false);
                    }
                    else if (methodName.Equals("Drop") && methodCall.Arguments.Count == 1)
                    {
                        yield return Drop(methodCall, stack);
                    }
                    else
                        throw new NotSupportedException($"Method call {methodCall.Method.Name}");
                }
                else if (item is UnaryExpression unaryExpression)
                {
                    Push(stack, unaryExpression.Operand);
                }
                else if (item is LambdaExpression)
                {
                    throw new NotSupportedException();
                }
                else if (item is BinaryExpression binaryExpression)
                {
                    Push(stack, binaryExpression.Left);
                    Push(stack, binaryExpression.Right);
                    yield return (2, args => Binary(binaryExpression.NodeType, args[0], args[1]));
                }
                else if (item is ParameterExpression param)
                {
                    yield return (0, _ => Cache(cache, param, Parameter));
                }
                else if (item is ConstantExpression constantExpression)
                {
                    var value = constantExpression.Value;
                    if (value != null)
                    {
                        var valueType = value.GetType();
                        var queryableType = typeof(IQueryable<>).MapFrom(valueType);
                        if (queryableType != null)
                        {
                            var itemType = queryableType.GenericTypeArguments[0];
                            yield return (0, _ => Vertex(itemType));
                        }
                        else if (valueType.IsPrimitive || value is string)
                        {
                            yield return (0, _ => Const(value).ToTraversal());
                        }
                        else
                        {
                            throw new NotImplementedException();
                        }
                    }
                }
                else if (item is MemberExpression memberExpression)
                {
                    if (memberExpression.Expression.Type.IsAnonymousType())
                        yield return (0, args => new GraphTraversal(new Select(memberExpression.Member.Name, memberExpression.Type)));
                    else
                    {
                        var many = memberExpression.Type.IsEnumerable();

                        var elementType = GetElementType(memberExpression.Type);
                        var isValues = elementType.IsPrimitive() || elementType.IsComplexType();

                        var (memberExprs, instanceExpr) = Split(memberExpression);
                        if (!memberExprs.Any())
                        {
                            Push(stack, memberExpression.Expression);
                            yield return (1, args => args[0].Append(Out(memberExpression.Member.Name, elementType, many)));
                        }
                        else
                        {
                            Push(stack, instanceExpr);

                            yield return (1, args =>
                            {
                                var memberNames = memberExprs.Aggregate(Enumerable.Empty<string>(),
                                    (a, m) => a.Append(m.Member.Name.ToCamelCase())).Reverse().Join(".");

                                if (isValues)
                                    return args[0].Append(Values(memberNames, elementType));

                                return args[0].Append(Out(memberNames, elementType, many));
                            });
                        }
                    }
                }
                else if (item is NewExpression newExpression)
                {
                    if (!newExpression.Type.IsAnonymousType())
                        throw new NotSupportedException($"GetOperators {newExpression}");

                    foreach (var arg in newExpression.Arguments)
                        Push(stack, arg);

                    yield return (newExpression.Arguments.Count, args =>
                            {
                                var dict = newExpression.Members.Select(e => e.Name.ToCamelCase())
                                    .Zip(args, (method, arg) => (method, arg))
                                    .ToDictionary(e => e.Item1, e => e.Item2);

                                var project = new Project(dict);

                                return new GraphTraversal(project);
                            }
                        );
                }
                else
                {
                    throw new NotImplementedException($"GetOperators {item}");
                }
            }
        }

        private static (MemberExpression[] memberExprs, Expression instanceExpr) Split(MemberExpression memberExpression)
        {
            var elementType = GetElementType(memberExpression.Type);
            var isValues = elementType.IsPrimitive() || elementType.IsComplexType();
            if (isValues)
            {
                var instanceExpr = memberExpression.Expression;
                if (instanceExpr is MemberExpression parentExpression)
                {
                    var p = Split(parentExpression);
                    return (p.memberExprs.Prepend(memberExpression).ToArray(), p.instanceExpr);
                }

                return (new[] {memberExpression}, instanceExpr);
            }
            else
            {
                return (new MemberExpression[0], memberExpression);
            }
        }

        private static Type GetElementType(Type type)
        {
            if (type == typeof(string))
                return type;
            return type.GetItemType() ?? type;
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) Select(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            Push(stack, source);
            Push(stack, predicate.Body);
            return (2, args => args[0].Append(As(predicate.Parameters[0].Name, predicate.Parameters[0].Type)).Bind(args[1]));
        }

        private static void Push(Stack<Expression> stack, Expression expr)
        {
            stack.Push(expr);
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) Where(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            Push(stack, source);
            Push(stack, predicate.Body);
            return (2, args => Where(args[0],
                args[1].Replace(By.Select(predicate.Parameters[0].Name), new Context(source.Type))
            ));
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) OrderBy(MethodCallExpression methodCall, Stack<Expression> stack, bool ascending = true)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            Push(stack, source);
            Push(stack, predicate.Body);

            return (2, args => args[0].Append(new OrderBy(ascending,
                    args[1].Replace(By.Select(predicate.Parameters[0].Name), new Context(source.Type))))
                );
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) Drop(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            Push(stack, methodCall.Arguments[0]);
            return (1, args => args[0].Append(new Drop()));
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) SelectMany2(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var sourceExpr = methodCall.Arguments[0];
            var collectionLambda = methodCall.Arguments[1] is UnaryExpression u
                ? (LambdaExpression)u.Operand
                : throw new NotSupportedException();

            Push(stack, sourceExpr);
            Push(stack, collectionLambda.Body);

            return (2, args =>
            {
                var source = args[0];
                var collection = args[1];

                return source.Bind(collection);
            });
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) SelectMany3(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var sourceExpr = methodCall.Arguments[0];
            var collectionLambda = methodCall.Arguments[1] is UnaryExpression u
                ? (LambdaExpression)u.Operand
                : throw new NotSupportedException();

            var selectorLambda = methodCall.Arguments[2] is UnaryExpression s
                ? (LambdaExpression)s.Operand
                : throw new NotSupportedException();

            bool isAdhocSelector = IsSelectManySelector(selectorLambda.Body);

            Push(stack, sourceExpr);
            Push(stack, collectionLambda.Body);

            if (isAdhocSelector)
            {
                return (2, args =>
                        {
                            var sourceParam = selectorLambda.Parameters[0];
                            var source = args[0].Append(As(sourceParam.Name, sourceParam.Type));
                            var collectionParam = selectorLambda.Parameters[1];
                            var collection = args[1].Append(As(collectionParam.Name, collectionParam.Type));

                            return source
                                .Bind(collection);
                        }
                    );
            }
            else
            {
                Push(stack, selectorLambda.Body);
                return (3, args =>
                        {
                            var selectorParameters = selectorLambda.Parameters
                                .Where(e => !e.Type.IsAnonymousType())
                                .Reverse().Take(2)
                                .ToArray();

                            var source = selectorParameters.Length > 1
                                ? args[0].Append(As(selectorParameters[1].Name, selectorParameters[1].Type))
                                : args[0];

                            var collection = args[1].Append(As(selectorParameters[0].Name, selectorParameters[0].Type));
                            var selector = args[2];

                            return source
                                .Bind(collection)
                                .Bind(selector);
                        }
                    );
            }
        }

        private static bool IsSelectManySelector(Expression expr)
        {
            return expr.Type.IsAnonymousType() && expr is NewExpression newX && newX.Members.Count == 2;
        }

        //private static LambdaExpression Flatten(LambdaExpression lambda)
        //{
        //    var body = ReplaceVisitor2.VisitAndConvert(lambda.Body, expr =>
        //    {
        //        if (expr.Type.IsAnonymousType() && expr is NewExpression newX && newX.Members.Count == 2)
        //        {
        //            return Expression.New()
        //        }

        //        if (expr is MemberExpression mem && mem.Expression is ParameterExpression par && par.Type.IsAnonymousType())
        //        {
        //            return Expression.Parameter(mem.Member.DeclaringType, mem.Member.Name);
        //        }

        //        return expr;
        //    });
        //    //{
        //    //    var curr = stack.Pop();
        //    //    if (curr.Type.IsAnonymousType())
        //    //    {
        //    //        foreach (var propertyInfo in curr.Type.GetProperties())
        //    //        {
        //    //        }
        //    //    }
        //    //}


        //    return lambda;
        //    // return Expression.Lambda(body, parameters);

        //}

        private static GraphTraversal Parameter(ParameterExpression parameter)
        {

            if (parameter.Type.IsAnonymousType())
                return new Select("anonymous", parameter.Type).ToTraversal();

            return new Select(parameter.Name, parameter.Type).ToTraversal();
        }

        private static GraphTraversal Where(GraphTraversal source, GraphTraversal predicate)
        {
            if (predicate.Steps.ElementAtOrDefault(0) is Context && !predicate.Steps.Any(e => e is Out))
                return new GraphTraversal(source.Steps.Concat(predicate.Steps.Skip(1)));
            return source.Append(new Where(predicate, source.GetType()));
        }

        private static GraphTraversal Binary(ExpressionType oper, GraphTraversal left, GraphTraversal right)
        {
            if (oper == ExpressionType.Equal)
            {
                if (left.Steps.Last() is Values values)
                {
                    var reverseTail = left.Steps.Take(left.Steps.Count() - 1);
                    var reverseHead = new Has(values.Name, new Eq(right.Steps.SingleOrDefault()));

                    return new GraphTraversal(reverseTail).Append(reverseHead);
                }
            }
            throw new NotImplementedException();
        }

        private static TValue Cache<TKey, TValue>(Dictionary<TKey, TValue> cache, TKey key, Func<TKey, TValue> func)
        {
            if (!cache.TryGetValue(key, out var result))
                cache.Add(key, result = func(key));

            return result;
        }

        private static LambdaExpression GetSingleParameterLambda(Expression expression)
        {
            if (expression is UnaryExpression unaryExpression)
            {
                if (unaryExpression.Operand is LambdaExpression lambda)
                {
                    if (lambda.Parameters.Count != 1)
                        throw new NotSupportedException("Parameters count more 1.");

                    return lambda;
                }
                throw new NotSupportedException("Where second argument not supported.");
            }
            else if (expression is LambdaExpression lambda)
            {
                if (lambda.Parameters.Count != 1)
                    throw new NotSupportedException("Parameters count more 1.");

                return lambda;
            }
            else
            {
                throw new NotSupportedException("Where second argument not supported.");
            }
        }

        public static Out Out(string edgeLabel, Type type, bool many)
        {
            return new Out(edgeLabel, type, many);
        }

        public static Values Values(string name, Type type)
        {
            return new Values(name, type);
        }

        public static IStep As(string name, Type type)
        {
            if (type.IsAnonymousType())
                return null;

            return new Alias(name, type);
        }

        public static Const Const(object value)
        {
            return new Const(value);
        }

        public static GraphTraversal Vertex(Type type)
        {
            return new GraphTraversal(new V(type));
        }
    }
}