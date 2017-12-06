using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Newtonsoft.Json;
using Xania.CosmosDb.AST;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class CosmosQueryContext
    {
        public static string ToGremlin(Expression expression)
        {
            var step = Evaluate(expression);
            return $"g.V().{step.ToGremlin()}.{GetGremlinSelector(step)}";
        }

        private static string GetGremlinSelector(IExpr expr)
        {
            if (expr is Where where)
                return GetGremlinSelector(where.Source);
            if (expr is AST.Vertex)
                return "union(identity(), outE())";
            if (expr is AST.SelectMany many)
                return GetLambdaSelector(many.Selector.Body);
            throw new NotImplementedException($"step {expr.GetType().Name}");
        }

        private static string GetLambdaSelector(IExpr expr)
        {
            if (expr is Parameter param)
                return $"union(identity(), select('{param.Name}').outE())";
            if (expr is Member member)
                return $"union(identity(), identity().outE())";
            throw new NotImplementedException($"step {expr.GetType().Name}");
        }

        public static IExpr Evaluate(Expression expression)
        {
            /**
             * Evaluate expression
             */
            var values = new Stack<IExpr>();
            foreach (var oper in GetOperators(expression).Reverse())
            {
                var args = PopValues(values, oper.Item1).ToArray();
                var expr = oper.Item2(args);
                values.Push(expr);
            }

            var result = values.Single();
            Console.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented, new JsonSerializerSettings()));
            return result;
        }

        private static IExpr[] PopValues(Stack<IExpr> values, int operCount)
        {
            var arr = new IExpr[operCount];
            for (var i = operCount - 1; i >= 0; i--)
            {
                arr[i] = values.Pop();
            }
            return arr;
        }

        private static IEnumerable<(int, Func<IExpr[], IExpr>)> GetOperators(Expression root)
        {
            var cache =  new Dictionary<ParameterExpression, IExpr>();
            var stack = new Stack<Expression>();
            stack.Push(root);
            while (stack.Count > 0)
            {
                var item = stack.Pop();
                if (item is MethodCallExpression methodCall)
                {
                    var methodName = methodCall.Method.Name;
                    if (methodName.Equals("Where"))
                    {
                        var lambda = GetSingleParameterLambda(methodCall, stack);
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(lambda);
                        yield return (2, Where);
                    }
                    else if (methodName.Equals("SelectMany"))
                    {
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(methodCall.Arguments[1]);
                        stack.Push(methodCall.Arguments[2]);
                        yield return (3, SelectMany);
                    }
                    else
                        throw new NotSupportedException($"Method call {methodCall.Method.Name}");
                }
                else if (item is UnaryExpression unaryExpression)
                {
                    stack.Push(unaryExpression.Operand);
                }
                else if (item is LambdaExpression lambda)
                {
                    foreach (var p in lambda.Parameters)
                        stack.Push(p);
                    stack.Push(lambda.Body);
                    yield return (lambda.Parameters.Count + 1, Lambda);
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
                            yield return (0, _ => new AST.Vertex(itemType.Name.ToCamelCase()));
                        }
                        else if (valueType.IsPrimitive || value is string)
                        {
                            yield return (0, _ => new AST.Constant(constantExpression.Value));
                        }
                        else
                        {
                            throw new NotImplementedException();
                            // yield return new Term($"C:[{item.GetType()}]");
                        }
                    }
                }
                else if (item is MemberExpression memberExpression)
                {
                    var memberName = memberExpression.Member.Name.ToCamelCase();
                    stack.Push(memberExpression.Expression);
                    yield return (1, args => Member(args[0], memberName));

                    //if (!(memberExpression.Expression is ParameterExpression))
                    //{
                    //    yield return new Format("out('{0}')") {Count = 1};
                    //    stack.Push(memberExpression.Expression);
                    //}
                }
                else
                {
                    throw new NotImplementedException();
                    // yield return new Term($"[[{item.GetType()}]]");
                }
            }
        }

        private static IExpr Member(IExpr target, string name)
        {
            return new Member(target, name);
        }

        private static IExpr Parameter(ParameterExpression parameter)
        {
            return new Parameter(parameter.Name, parameter.Type.Name.ToCamelCase());
        }

        private static IExpr Lambda(IExpr[] args)
        {
            return new Lambda(args.Take(args.Length - 1).Cast<Parameter>().ToArray(), args.Last());
        }

        private static IExpr SelectMany(IExpr[] args)
        {
            return new SelectMany(args[0], (Lambda) args[1], (Lambda) args[2]);
        }

        private static IExpr Where(IExpr[] args)
        {
            return new Where((AST.Vertex) args[0], (Lambda) args[1]);
        }

        private static IExpr Binary(ExpressionType oper, IExpr left, IExpr right)
        {
            if (left is Member member && oper == ExpressionType.Equal)
            {
                var binary = new Equal(member.Name, right);
                return new Compose(member.Target, binary);
            }
            throw new NotImplementedException();
        }

        private static TValue Cache<TKey, TValue>(Dictionary<TKey, TValue> cache, TKey key, Func<TKey, TValue> func)
        {
            if (!cache.TryGetValue(key, out var result))
                cache.Add(key, result = func(key));

            return result;
        }

        private static LambdaExpression GetSingleParameterLambda(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            if (methodCall.Arguments[1] is UnaryExpression unaryExpression)
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
    }
}