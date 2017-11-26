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
                            Method = "where",
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
                        if (binaryExpression.Left is MemberExpression left)
                        {
                            if (left.Expression is ParameterExpression)
                            {
                                yield return new Call
                                {
                                    Method = "has",
                                    Count = 1,
                                    Args = { $"'{left.Member.Name.ToCamelCase()}'" }
                                };
                                stack.Push(binaryExpression.Right);
                            }
                            else
                            {
                                yield return new MemberCall
                                {
                                    Method = "has",
                                    Count = 2,
                                    Args = { $"'{left.Member.Name.ToCamelCase()}'" }
                                };
                                stack.Push(left.Expression);
                                stack.Push(binaryExpression.Right);
                            }
                        }
                        else
                        {
                            throw new NotImplementedException();
                        }
                    }
                    else
                    {
                        yield return new Term($"[{item.GetType()}]");
                    }
                }
                else if (item is ParameterExpression)
                {
                    yield return new Term("_");
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
                            yield return new Term($"g.V().hasLabel('{itemType.Name.ToCamelCase()}')");
                        }
                        else if (valueType.IsPrimitive)
                        {
                            yield return new Term($"'{constantExpression.Value}'");
                        }
                        else if (value is string)
                        {
                            yield return new Term($"'{value}'");
                        }
                        else
                        {
                            yield return new Term($"C:[{item.GetType()}]");
                        }
                    }
                }
                else if (item is MemberExpression memberExpression)
                {
                    var memberName = memberExpression.Member.Name.ToCamelCase();
                    yield return new Member(memberName);

                    if (!(memberExpression.Expression is ParameterExpression))
                    {
                        stack.Push(memberExpression.Expression);
                    }
                }
                else
                {
                    yield return new Term($"[[{item.GetType()}]]");
                }
            }
        }
    }

    internal class Member : GremlinExpr
    {
        private readonly string _name;

        public Member(string name)
        {
            _name = name;
            Count = 0;
        }

        public override string ToGremlin(params string[] args)
        {
            return $"out('{_name}')";
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
        public ICollection<string> Args { get; } = new List<string>();

        public override string ToGremlin(params string[] args)
        {
            return $"{args[0]}.{Method}({string.Join(", ", Args.Concat(args.Skip(1)))})";
        }
    }

    internal class Call: GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<string> Args { get; } = new List<string>();
        public override string ToGremlin(params string[] args)
        {
            return $"{Method}({string.Join(", ", Args.Concat(args))})";
        }
    }
}