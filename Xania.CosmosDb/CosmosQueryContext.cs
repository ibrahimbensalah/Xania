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
                        yield return new WhereExpr { };
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(lambda.Parameters[0]);
                        stack.Push(lambda.Body);
                    }
                    else if (methodName.Equals("SelectMany"))
                    {
                        yield return new SelectManyExpr { };
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
                    throw new NotSupportedException();
                }
                else if (item is BinaryExpression binaryExpression)
                {
                    yield return new Binary(ExpressionType.Equal);
                    stack.Push(binaryExpression.Left);
                    stack.Push(binaryExpression.Right);
                }
                else if (item is ParameterExpression param)
                {
                    yield return new Term(new AST.Vertex(param.Type.Name.ToCamelCase()));
                    // yield return new Term(param.Name);
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
                    throw new NotImplementedException();
                    // yield return new Term($"[[{item.GetType()}]]");
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
                throw new NotSupportedException("Where second argument not supported.");
            }
            else
            {
                throw new NotSupportedException("Where second argument not supported.");
            }
        }
    }

    internal class SelectManyExpr : GremlinExpr
    {
        public SelectManyExpr()
        {
            Count = 3;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (args[0] is IPipe pipe)
                return pipe.SelectMany(args[1], args[2]);
            throw new InvalidOperationException("not a pipe");
        }
    }

    internal class WhereExpr : GremlinExpr
    {
        public WhereExpr()
        {
            Count = 3;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (args[0] is IPipe pipe)
                return pipe.Where(args[2]);
            throw new InvalidOperationException("not a pipe");
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

        public override IStep ToGremlin(params IStep[] args)
        {
            return new Route(args[0], _name);
        }
    }

    internal class Binary : GremlinExpr
    {
        private readonly ExpressionType _oper;

        public Binary(ExpressionType oper)
        {
            _oper = oper;
            Count = 2;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (_oper == ExpressionType.Equal)
            {
                return args[0].Has(args[1]);
            }
            throw new NotImplementedException();
            // yield return new Term(new Vertex($"[{item.GetType()}]"));
        }
    }

    internal class Term : GremlinExpr
    {
        private readonly IStep _value;

        public Term(IStep value)
        {
            _value = value;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (args.Length > 0)
                throw new InvalidOperationException("Arguments not expected");

            return _value;
        }
    }

    internal abstract class GremlinExpr
    {
        public int Count { get; set; } = 0;
        public abstract IStep ToGremlin(params IStep[] args);
    }

    internal class MemberCall : GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<IStep> Args { get; } = new List<IStep>();

        public override IStep ToGremlin(params IStep[] args)
        {
            return new AST.MemberCall(args[0], Method, Args.Concat(args.Skip(1)).ToArray());
        }
    }

    internal class Call : GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<IStep> Args { get; } = new List<IStep>();
        public override IStep ToGremlin(params IStep[] args)
        {
            return new AST.MemberCall(null, Method, Args.Concat(args).ToArray());
        }
    }
}
