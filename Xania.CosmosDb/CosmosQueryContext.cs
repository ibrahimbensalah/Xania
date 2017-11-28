using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class CosmosQueryContext
    {
        public static string ToGremlin(Expression expression)
        {
            /**
             * Evaluate expression
             */
            var values = new Stack<GremlinAST>();
            foreach (var oper in GetOperators(expression).Reverse())
            {
                var args = PopValues(values, oper.Count).ToArray();
                values.Push(oper.ToGremlin(args));
            }

            return "g.V()." + values.Single();
        }

        private static GremlinAST[] PopValues(Stack<GremlinAST> values, int operCount)
        {
            var arr = new GremlinAST[operCount];
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
                    var methodName = methodCall.Method.Name;
                    if (methodName.Equals("Where"))
                    {
                        var lambda = GetSingleParameterLambda(methodCall, stack);
                        yield return new MemberCall
                        {
                            Method = $"as('{lambda.Parameters[0].Name}').where",
                            Count = 2
                        };
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(lambda.Body);
                    }
                    else if (methodName.Equals("SelectMany"))
                    {
                        yield return new Traverse { };
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(methodCall.Arguments[1]);
                        stack.Push(methodCall.Arguments[2]);
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
                    //if (lambda.Parameters.Count != 1)
                    throw new NotSupportedException("Parameters count more 1.");
                    // stack.Push(lambda.Body);
                }
                else if (item is BinaryExpression binaryExpression)
                {
                    if (binaryExpression.NodeType == ExpressionType.Equal)
                    {
                        yield return new Binary("has");
                        stack.Push(binaryExpression.Left);
                        stack.Push(binaryExpression.Right);

                        //if (binaryExpression.Left is MemberExpression left)
                        //{
                        //    if (left.Expression is ParameterExpression)
                        //    {
                        //        yield return new Call
                        //        {
                        //            Method = "has",
                        //            Count = 1,
                        //            Args = { $"'{left.Member.Name.ToCamelCase()}'" }
                        //        };
                        //        stack.Push(binaryExpression.Right);
                        //    }
                        //    else
                        //    {
                        //        yield return new MemberCall
                        //        {
                        //            Method = "has",
                        //            Count = 2,
                        //            Args = { $"'{left.Member.Name.ToCamelCase()}'" }
                        //        };
                        //        stack.Push(left.Expression);
                        //        stack.Push(binaryExpression.Right);
                        //    }
                        //}
                        //else
                        //{
                        //    throw new NotImplementedException();
                        //}
                    }
                    else
                    {
                        yield return new Term($"[{item.GetType()}]");
                    }
                }
                else if (item is ParameterExpression param)
                {
                    yield return new Term(param.Name);
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
                            yield return new Term($"hasLabel('{itemType.Name.ToCamelCase()}')");
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
                    stack.Push(memberExpression.Expression);

                    //if (!(memberExpression.Expression is ParameterExpression))
                    //{
                    //    yield return new Format("out('{0}')") {Count = 1};
                    //    stack.Push(memberExpression.Expression);
                    //}
                }
                else
                {
                    yield return new Term($"[[{item.GetType()}]]");
                }
            }
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
                else
                {
                    throw new NotSupportedException("Where second argument not supported.");
                }
            }
            else
            {
                throw new NotSupportedException("Where second argument not supported.");
            }
        }
    }

    internal class Member : GremlinExpr
    {
        private readonly string _name;

        public Member(string name)
        {
            _name = name;
            Count = 1;
        }

        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            return $"out({args[0]}).'{_name}'";
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

        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            return $"{_oper}({args[0]}, {args[1]})";
        }
    }

    internal class Format : GremlinExpr
    {
        private readonly string _format;

        public Format(string format)
        {
            _format = format;
        }

        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            return string.Format(_format, args);
        }
    }

    internal class Term : GremlinExpr
    {
        private readonly object _value;

        public Term(object value)
        {
            _value = value;
        }

        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            if (args.Length > 0)
                throw new InvalidOperationException("Arguments not expected");
            return _value?.ToString() ?? "null";
        }
    }

    internal abstract class GremlinExpr
    {
        public int Count { get; set; } = 0;
        public abstract GremlinAST ToGremlin(params GremlinAST[] args);
    }

    internal class MemberCall : GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<GremlinAST> Args { get; } = new List<GremlinAST>();

        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            return $"{args[0]}.{Method}({string.Join(", ", Args.Concat(args.Skip(1)))})";
        }
    }

    internal class Call : GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<GremlinAST> Args { get; } = new List<GremlinAST>();
        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            return $"{Method}({string.Join(", ", Args.Concat(args))})";
        }
    }

    internal class Traverse : GremlinExpr
    {
        public Traverse()
        {
            Count = 3;
        }

        public override GremlinAST ToGremlin(params GremlinAST[] args)
        {
            return string.Join(".", args.Select(e => e.ToString()));
        }
    }

    internal interface GremlinAST
    {
    }
}