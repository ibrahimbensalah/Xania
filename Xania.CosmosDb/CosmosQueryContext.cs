using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Xania.CosmosDb
{
    public class CosmosQueryContext
    {
        public static string ToGremlin(Expression expression)
        {
            // The expression must represent a query over the data source. 
            if (!IsQueryOverDataSource(expression))
                throw new InvalidProgramException("No query over the data source was specified.");

            /**
             * Evaluate expression
             */
            var values = new Stack<string>();
            foreach (var oper in GetOperators(expression).Reverse())
            {
                var args = PopValues(values, oper.Count).ToArray();
                values.Push(oper.ToGremlin(args));
            }

            return values.Single();
        }

        private static string[] PopValues(Stack<string> values, int operCount)
        {
            var arr = new string[operCount];
            for (var i = operCount - 1; i >= 0; i--)
            {
                arr[i] = values.Pop();
            }
            return arr;
        }

        private static IEnumerable<GremlinExpr> GetOperators(Expression root)
        {
            var stack = new Stack<Expression>();
            stack.Push(root);
            while (stack.Count > 0)
            {
                var item = stack.Pop();
                if (item is MethodCallExpression methodCall)
                {
                    if (methodCall.Method.Name.Equals("Where"))
                    {
                        yield return new MemberCall
                        {
                            Method = "filter",
                            Count = 2
                        };
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(methodCall.Arguments[1]);
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
                    if (lambda.Parameters.Count != 1)
                        throw new Exception("Parameters count more 1");

                    stack.Push(lambda.Body);
                }
                else if (item is BinaryExpression binaryExpression)
                {
                    if (binaryExpression.NodeType == ExpressionType.Equal)
                    {
                        yield return new Call {Method = "has", Count = 2};
                        stack.Push(binaryExpression.Left);
                        stack.Push(binaryExpression.Right);
                    }
                    else
                    {
                        yield return new Term($"[{item.GetType()}]");
                    }
                }
                else if (item is ParameterExpression)
                {
                    yield return new Term("it");
                }
                else if (item is ConstantExpression constantExpression)
                {
                    var value = constantExpression.Value;
                    if (value != null)
                    {
                        var valueType = value.GetType();
                        if (valueType.IsGenericType && valueType.GenericTypeArguments.Length == 1 && valueType.GetGenericTypeDefinition() == typeof(GraphQueryable<>))
                        {
                            var itemType = valueType.GenericTypeArguments[0];
                            yield return new Term($"'g.V().has('label', '{itemType.Name.ToCamelCase()}')");
                        }
                        else if (valueType.IsPrimitive)
                        {
                            yield return new Term(constantExpression.Value);
                        }
                        else
                        {
                            yield return new Term($"C:[{item.GetType()}]");
                        }
                    }
                }
                else if (item is MemberExpression memberExpression)
                {
                    yield return new Term($"'{memberExpression.Member.Name}'");
                }
                else
                {
                    yield return new Term($"[[{item.GetType()}]]");
                }
            }
        }

        private static bool IsQueryOverDataSource(Expression expression)
        {
            // If expression represents an unqueried IQueryable data source instance, 
            // expression is of type ConstantExpression, not MethodCallExpression. 
            return (expression is MethodCallExpression);
        }
    }

    internal class Binary : GremlinExpr
    {
        private readonly string _oper;

        public Binary(string oper)
        {
            _oper = oper;
            Count = 2;
        }

        public override string ToGremlin(params string[] args)
        {
            return $"{args[0]} {_oper} {args[1]}";
        }
    }

    internal class Term : GremlinExpr
    {
        private readonly object _value;

        public Term(object value)
        {
            _value = value;
        }

        public override string ToGremlin(params string[] args)
        {
            if (args.Length > 0)
                throw new InvalidOperationException("Arguments not expected");
            return _value?.ToString() ?? "null";
        }
    }

    internal abstract class GremlinExpr
    {
        public int Count { get; set; } = 0;
        public abstract string ToGremlin(params string[] args);
    }

    internal class MemberCall : GremlinExpr
    {
        public string Method { get; set; }
        public override string ToGremlin(params string[] args)
        {
            return $"{args[0]}.{Method}({args[1]})";
        }
    }

    internal class Call: GremlinExpr
    {
        public string Method { get; set; }
        public override string ToGremlin(params string[] args)
        {
            return $"{Method}({args[0]}, {args[1]})";
        }
    }
}