using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using Xania.CosmosDb.Gremlin;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class GremlinQueryContext
    {
        private static class By
        {
            public static Func<IGremlinExpr, bool> Select(string paramName)
            {
                return e => e is Select select && select.Label.Equals(paramName);
            }
        }

        public static Traversal Evaluate(Expression expression)
        {
            /**
             * Evaluate expression
             */
            var values = new Stack<Traversal>();
            foreach (var oper in GetOperators(expression).Reverse())
            {
                var args = PopValues(values, oper.Item1).ToArray();
                var expr = oper.Item2(args);
                values.Push(expr);
            }

            return values.Single();
        }

        private static Traversal[] PopValues(Stack<Traversal> values, int operCount)
        {
            var arr = new Traversal[operCount];
            for (var i = operCount - 1; i >= 0; i--)
            {
                arr[i] = values.Pop();
            }
            return arr;
        }

        private static IEnumerable<(int, Func<Traversal[], Traversal>)> GetOperators(Expression root)
        {
            var cache = new Dictionary<ParameterExpression, Traversal>();
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
                        yield return (0, args => new Traversal(new Select(memberExpression.Member.Name)));
                    else
                    {
                        var isPrimitive = Graph.IsPrimitive(memberExpression.Type);

                        var memberName = memberExpression.Member.Name.ToCamelCase();
                        stack.Push(memberExpression.Expression);


                        yield return (1, args =>
                            isPrimitive ? args[0].Append(Values(memberName)) : args[0].Append(Out(memberName)));
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
                            var project = $"project({newExpression.Members.Select(e => $"'{e.Name.ToCamelCase()}'").Join(", ")})" +
                                          $".by(coalesce({args.SelectMany(ToGremlinSelector).Join(", constant())).by(coalesce(")}, constant()))";
                            return new Traversal(Enumerable.Empty<IGremlinExpr>())
                            {
                                Selector = new GremlinSelector(project.ToString())
                            };
                        }
                    );
                }
                else
                {
                    throw new NotImplementedException($"GetOperators {item}");
                }
            }
        }


        private static IEnumerable<string> ToGremlinSelector(Traversal traversal)
        {
            var str = traversal.ToString();

            if (!string.IsNullOrEmpty(str))
                yield return str;


            if (traversal.Selector != null)
                yield return traversal.Selector.ToString();
        }

        private static (int, Func<Traversal[], Traversal>) Select(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            stack.Push(source);
            stack.Push(predicate.Body);
            return (2, args => args[0].Append(As(predicate.Parameters[0].Name)).Bind(args[1]));
        }

        private static (int, Func<Traversal[], Traversal>) Where(MethodCallExpression methodCall, Stack<Expression> stack)
        {
            var source = methodCall.Arguments[0];
            var predicate = GetSingleParameterLambda(methodCall.Arguments[1]);
            stack.Push(source);
            stack.Push(predicate.Body);
            return (2, args => Where(args[0],
                args[1].Replace(By.Select(predicate.Parameters[0].Name), Traversal.__)
            ));
        }

        private static (int, Func<Traversal[], Traversal>) SelectMany(MethodCallExpression methodCall, Stack<Expression> stack)
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

        private static IEnumerable<string> UnfoldParameter(ParameterExpression expr)
        {
            if (!expr.Type.IsAnonymousType())
                yield return expr.Name;
            else
            {
                foreach (PropertyInfo p in expr.Type.GetProperties())
                    yield return p.Name;
            }
        }

        private static Traversal Parameter(ParameterExpression parameter)
        {
            return new Select(parameter.Name).ToTraversal();
        }

        private static Traversal Where(Traversal source, Traversal predicate)
        {
            if (predicate.Steps.ElementAtOrDefault(0) is Context && !predicate.Steps.Any(e => e is Out))
                return new Traversal(source.Steps.Concat(predicate.Steps.Skip(1)));
            return source.Append(Scope("where", predicate));
        }

        private static Traversal Binary(ExpressionType oper, Traversal left, Traversal right)
        {
            if (oper == ExpressionType.Equal)
            {
                if (left.Steps.Last() is Values values)
                {
                    var rightSteps = values.Name.Equals("id", StringComparison.OrdinalIgnoreCase) ?
                        right.Steps.Select(e => e is Const cons ? new Const(cons.Value.ToString()) : e) :
                        right.Steps;

                    var reverseTail = left.Steps.Take(left.Steps.Count() - 1);
                    var reverseHead = new Call("has", new Const(values.Name), new Eq(rightSteps));

                    return new Traversal(reverseTail).Append(reverseHead);
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

        public static IGremlinExpr As(string name)
        {
            return new Alias(name);
        }

        public static Const Const(object value)
        {
            return new Const(value);
        }

        public static Scope Scope(string methodName, Traversal traversal)
        {
            return new Scope(methodName, traversal);
        }

        public static Call Call(string methodName, IEnumerable<IGremlinExpr> expressions)
        {
            return new Call(methodName, expressions);
        }

        public static Bind Bind(IGremlinExpr expr1, IGremlinExpr expr2)
        {
            return new Bind(new[] { expr1, expr2 });
        }

        public static Bind Bind(IGremlinExpr head, IEnumerable<IGremlinExpr> expressions)
        {
            if (head is Bind bind)
                return new Bind(bind.Expressions.Concat(expressions).ToArray());
            var list = new List<IGremlinExpr> { head };
            foreach (var expr in expressions)
                list.Add(expr);
            return new Bind(list.ToArray());
        }

        public static Traversal Vertex(string label)
        {
            return new Traversal(new Call("hasLabel", Const(label)));
        }
    }

    public class Alias : IGremlinExpr
    {
        public string Value { get; }

        public Alias(string value)
        {
            Value = value;
        }

        public override string ToString()
        {
            return $"as('{Value}')";
        }
    }

    public class Traversal
    {
        public IEnumerable<IGremlinExpr> Steps { get; }
        public GremlinSelector Selector { get; set; }

        public Traversal(IGremlinExpr step)
            : this(new[] { step })
        {
        }

        public Traversal(IEnumerable<IGremlinExpr> steps)
        {
            Steps = steps;
        }

        public override string ToString()
        {
            return $"{string.Join(".", Steps.Select(e => e.ToString()))}";
        }

        public static readonly Context __ = new Context();

        public Traversal Append(IGremlinExpr expr)
        {
            if (expr is Values)
                return new Traversal (Steps.Append(expr)) { Selector = null };
            return new Traversal(Steps.Append(expr)) { Selector = Selector };
        }

        public Traversal Bind(Traversal other)
        {
            var otherSteps = (other.Steps.FirstOrDefault() is Context) ? other.Steps.Skip(1).ToArray() : other.Steps.ToArray();

            if (Steps.LastOrDefault() is Alias l)
            {
                if (!otherSteps.Any(e => e is Select s && s.Label.Equals(l.Value)))
                    return new Traversal(Steps.Concat(otherSteps))
                    {
                        Selector = other.Selector
                    };
                if (otherSteps.FirstOrDefault() is Select f && f.Label.Equals(l.Value))
                    return new Traversal(Steps.Concat(otherSteps.Skip(1)))
                    {
                        Selector = other.Selector
                    };
            }

            return new Traversal(Steps.Concat(otherSteps))
            {
                Selector = other.Selector
            };
        }
    }

    public class GremlinSelector
    {
        private readonly string _expression;

        public GremlinSelector(string expression)
        {
            _expression = expression;
        }

        public override string ToString()
        {
            return _expression;
        }
    }

    public static class TraversalExtensions
    {
        public static Traversal Replace(this Traversal traversal, Func<IGremlinExpr, bool> predicate,
            IGremlinExpr replacement)
        {
            return new Traversal(traversal.Steps.Select(e => predicate(e) ? replacement : e))
            {
                Selector = traversal.Selector
            };
        }

        public static IEnumerable<IGremlinExpr> Replace(this IEnumerable<IGremlinExpr> steps, Func<IGremlinExpr, bool> predicate,
            Func<IGremlinExpr, IGremlinExpr> replace)
        {
            return steps.Select(e => predicate(e) ? replace(e) : e);
        }

        public static string Join<T>(this IEnumerable<T> source, string separator)
        {
            return source.Aggregate(new StringBuilder(), (sb, e) => sb.Length > 0 ? sb.Append(separator).Append(e) : sb.Append(e)).ToString();
        }
    }
}