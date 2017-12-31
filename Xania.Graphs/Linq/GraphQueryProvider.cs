using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
    public class GraphQueryProvider : IQueryProvider
    {
        private readonly IGraphDataContext _client;

        public GraphQueryProvider(IGraphDataContext client)
        {
            _client = client;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            throw new NotImplementedException();
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new GraphQueryable<TElement>(this, expression);
        }

        public object Execute(Expression expression)
        {
            throw new NotImplementedException();
        }

        public TResult Execute<TResult>(Expression expression)
        {
            bool IsEnumerable = (typeof(TResult).Name == "IEnumerable`1");

            //if (!IsEnumerable)
            //    throw new NotImplementedException();

            var traversal = Evaluate(expression);

            if (IsEnumerable)
            {
                var resultType = typeof(IQueryable<>).MapTo(typeof(TResult));
                var elementType = resultType.GenericTypeArguments[0];

                //var items = _client.ExecuteGremlinAsync(gremlin).Result.OfType<JObject>()
                //    .Select(result => Client.ConvertToObject(result, elementType));
                var items = _client.ExecuteAsync(traversal, elementType).Result;

                return (TResult)resultType.CreateCollection(items.ToArray());
            }
            else
            {
                var result = _client.ExecuteAsync(traversal, typeof(TResult)).Result.SingleOrDefault();
                if (result == null)
                    return default(TResult);
                return (TResult)result.Convert(typeof(TResult));
            }
        }

        private static class By
        {
            public static Func<IStep, bool> Select(string paramName)
            {
                return e => e is Select select && select.Label.Equals(paramName);
            }
        }

        public static GraphTraversal Evaluate(Expression expression)
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
            stack.Push(root);
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
                    else if (methodName.Equals("SelectMany") && methodCall.Arguments.Count == 3)
                    {
                        yield return SelectMany(methodCall, stack);
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
                    stack.Push(unaryExpression.Operand);
                }
                else if (item is LambdaExpression)
                {
                    throw new NotSupportedException();
                }
                else if (item is BinaryExpression binaryExpression)
                {
                    stack.Push(binaryExpression.Left);
                    stack.Push(binaryExpression.Right);
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
                        var queryableType = typeof(GraphQueryable<>).MapTo(valueType);
                        if (queryableType != null)
                        {
                            var itemType = queryableType.GenericTypeArguments[0];
                            yield return (0, _ => Vertex(itemType.Name.ToCamelCase()));
                        }
                        else if (valueType.IsPrimitive || value is string)
                        {
                            yield return (0, _ => Const(constantExpression.Value).ToTraversal());
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
                        yield return (0, args => new GraphTraversal(new Select(memberExpression.Member.Name)));
                    else
                    {
                        var isValues = memberExpression.Type.IsPrimitive() || memberExpression.Type.IsComplexType();

                        var memberName = memberExpression.Member.Name.ToCamelCase();
                        stack.Push(memberExpression.Expression);


                        yield return (1, args =>
                        {
                            if (isValues)
                                return args[0].Append(Values(memberName));
                            else
                                return args[0].Append(Out(memberName));
                        }
                        );
                    }
                }
                else if (item is NewExpression newExpression)
                {
                    if (!newExpression.Type.IsAnonymousType())
                        throw new NotSupportedException($"GetOperators {newExpression}");

                    foreach (var arg in newExpression.Arguments)
                        stack.Push(arg);

                    yield return (newExpression.Arguments.Count, args =>
                    {
                        var dict = newExpression.Members
                            .Zip(args, (method, arg) => (method.Name.ToCamelCase(), arg))
                            .ToDictionary(e => e.Item1, e => e.Item2);

                        var project = new Project(dict);

                        return new GraphTraversal(project);
                    });
                }
                else
                {
                    throw new NotImplementedException($"GetOperators {item}");
                }
            }
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) Select(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            stack.Push(source);
            stack.Push(predicate.Body);
            return (2, args => args[0].Append(As(predicate.Parameters[0].Name)).Bind(args[1]));
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) Where(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            stack.Push(source);
            stack.Push(predicate.Body);
            return (2, args => Where(args[0],
                args[1].Replace(By.Select(predicate.Parameters[0].Name), GraphTraversal.__)
            ));
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) OrderBy(MethodCallExpression methodCall, Stack<Expression> stack, bool ascending = true)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            stack.Push(source);
            stack.Push(predicate.Body);

            return (2, args => args[0].Append(new OrderBy(ascending, args[1].Replace(By.Select(predicate.Parameters[0].Name), GraphTraversal.__))));
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) Drop(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            stack.Push(methodCall.Arguments[0]);
            return (1, args => args[0].Append(new Drop()));
        }

        private static (int, Func<GraphTraversal[], GraphTraversal>) SelectMany(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var sourceExpr = methodCall.Arguments[0];
            var collectionLambda = methodCall.Arguments[1] is UnaryExpression u
                ? (LambdaExpression)u.Operand
                : throw new NotSupportedException();
            var selectorLambda = methodCall.Arguments[2] is UnaryExpression s
                ? (LambdaExpression)s.Operand
                : throw new NotSupportedException();

            stack.Push(sourceExpr);
            stack.Push(collectionLambda.Body);
            stack.Push(selectorLambda.Body);

            return (3, args =>
            {
                var selectorParameters = selectorLambda.Parameters
                    .Where(e => !e.Type.IsAnonymousType())
                    .Reverse().Take(2)
                    .ToArray();

                var source = selectorParameters.Length > 1
                    ? args[0].Append(As(selectorParameters[1].Name))
                    : args[0];

                var collection = args[1].Append(As(selectorParameters[0].Name));
                var selector = args[2];

                return source
                    .Bind(collection)
                    .Bind(selector);
            }
            );
        }

        private static GraphTraversal Parameter(ParameterExpression parameter)
        {
            return new Select(parameter.Name).ToTraversal();
        }

        private static GraphTraversal Where(GraphTraversal source, GraphTraversal predicate)
        {
            if (predicate.Steps.ElementAtOrDefault(0) is Context && !predicate.Steps.Any(e => e is Out))
                return new GraphTraversal(source.Steps.Concat(predicate.Steps.Skip(1)));
            return source.Append(new Where(predicate));
        }
        private static GraphTraversal Binary(ExpressionType oper, GraphTraversal left, GraphTraversal right)
        {
            if (oper == ExpressionType.Equal)
            {
                if (left.Steps.Last() is Values values)
                {
                    var rightSteps = values.Name.Equals("id", StringComparison.OrdinalIgnoreCase) ?
                        right.Steps.Select(e => e is Const cons ? new Const(cons.Value.ToString()) : e) :
                        right.Steps;

                    var reverseTail = left.Steps.Take(left.Steps.Count() - 1);
                    var reverseHead = new Has(values.Name, new Eq(rightSteps));

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
            else
            {
                throw new NotSupportedException("Where second argument not supported.");
            }
        }

        public static Out Out(string edgeLabel)
        {
            return new Out(edgeLabel);
        }

        public static Values Values(string name)
        {
            return new Values(name);
        }

        public static IStep As(string name)
        {
            return new Alias(name);
        }

        public static Const Const(object value)
        {
            return new Const(value);
        }

        public static Call Call(string methodName, IEnumerable<IStep> expressions)
        {
            return new Call(methodName, expressions);
        }

        public static Bind Bind(IStep expr1, IStep expr2)
        {
            return new Bind(new[] { expr1, expr2 });
        }

        public static Bind Bind(IStep head, IEnumerable<IStep> expressions)
        {
            if (head is Bind bind)
                return new Bind(bind.Expressions.Concat(expressions).ToArray());
            var list = new List<IStep> { head };
            foreach (var expr in expressions)
                list.Add(expr);
            return new Bind(list.ToArray());
        }

        public static GraphTraversal Vertex(string label)
        {
            return new GraphTraversal(new V(label));
        }
    }

    public class V : IStep
    {
        public string Label { get; }

        public V(string label)
        {
            Label = label;
        }

        public override string ToString()
        {
            return $"V().hasLabel('{Label}')";
        }
    }

    public class Drop : IStep
    {
        public override string ToString()
        {
            return "drop()";
        }
    }
}