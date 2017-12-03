using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.CosmosDb.AST;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class CosmosQueryContext
    {
        public static string ToGremlin(Expression expression)
        {
            return "g.V()." + Transpile(expression).ToGremlin();
        }

        public static IStep Transpile(Expression expression)
        {
            /**
             * Evaluate expression
             */
            var values = new Stack<IStep>();
            foreach (var oper in GetOperators(expression).Reverse())
            {
                var args = PopValues(values, oper.Count).ToArray();
                values.Push(oper.ToGremlin(args));
            }

            return values.Single();
        }

        private static IStep[] PopValues(Stack<IStep> values, int operCount)
        {
            var arr = new IStep[operCount];
            for (var i = operCount - 1; i >= 0; i--)
            {
                arr[i] = values.Pop();
            }
            return arr;
        }

        private static IEnumerable<GremlinExpr> GetOperators(Expression root)
        {
            var cache = new Dictionary<Expression, GremlinExpr>();
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
                        yield return new WhereExpr { };
                    }
                    else if (methodName.Equals("SelectMany"))
                    {
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(methodCall.Arguments[1]);
                        stack.Push(methodCall.Arguments[2]);
                        yield return new SelectManyExpr { };
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
                    yield return new LambdaExpr(lambda.Parameters.Count);
                }
                else if (item is BinaryExpression binaryExpression)
                {
                    stack.Push(binaryExpression.Left);
                    stack.Push(binaryExpression.Right);
                    yield return new Binary(ExpressionType.Equal);
                }
                else if (item is ParameterExpression param)
                {
                    yield return new Term(new AST.Parameter(param.Name, param.Type.Name.ToCamelCase()));
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
                            yield return new Term(new AST.Vertex(itemType.Name.ToCamelCase()));
                        }
                        else if (valueType.IsPrimitive || value is string)
                        {
                            yield return new Term(new AST.Constant(constantExpression.Value));
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
                    yield return new MemberExpr(memberName);

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

        private static GremlinExpr Cache<TKey>(Dictionary<TKey, GremlinExpr> cache, TKey key, Func<GremlinExpr> func)
        {
            if (!cache.TryGetValue(key, out var result))
                cache.Add(key, result = func());

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