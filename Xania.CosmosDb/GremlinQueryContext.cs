using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xania.CosmosDb.Gremlin;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class GremlinQueryContext
    {
        //private static string GetGremlinSelector(Traversal expr)
        //{
        //    if (expr is Where where)
        //        return GetGremlinSelector(where.Source);
        //    if (expr is AST.Vertex)
        //        return "union(identity(), outE())";
        //    if (expr is AST.SelectMany many)
        //        return GetLambdaSelector(many.Selector.Body);
        //    throw new NotImplementedException($"step {expr.GetType().Name}");
        //}

        //private static string GetLambdaSelector(Traversal expr)
        //{
        //    if (expr is Parameter param)
        //        return $"union(identity(), select('{param.Name}').outE())";
        //    if (expr is Member member)
        //        return $"union(identity(), identity().outE())";
        //    throw new NotImplementedException($"step {expr.GetType().Name}");
        //}

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
                    if (methodName.Equals("Where"))
                    {
                        var lambda = GetSingleParameterLambda(methodCall, stack);
                        stack.Push(methodCall.Arguments[0]);
                        stack.Push(lambda);
                        yield return (2, args => Where(args[0],
                                args[1].Replace(e => e is Select select && select.Label.Equals(lambda.Parameters[0].Name), Traversal.__)
                            ));
                    }
                    else if (methodName.Equals("SelectMany"))
                    {
                        foreach (var arg in methodCall.Arguments)
                            stack.Push(arg);

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
                    var parameters = lambda.Parameters.SelectMany(UnfoldParameter).ToArray();
                    stack.Push(lambda.Body);
                    yield return (1, args => new Traversal(args[0].Steps, parameters));
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
                    if (IsAnonymousType(memberExpression.Expression.Type))
                        yield return (0, args => new Traversal(new Select(memberExpression.Member.Name)));
                    else
                    {
                        var isPrimitive = Graph.IsPrimitive(memberExpression.Type);

                        var memberName = memberExpression.Member.Name.ToCamelCase();
                        stack.Push(memberExpression.Expression);


                        yield return (1, args =>
                            isPrimitive ? args[0].Append(Values(memberName)) : args[0].Append(Relation(memberName)));
                    }

                    //if (!(memberExpression.Expression is ParameterExpression))
                    //{
                    //    yield return new Format("out('{0}')") {Count = 1};
                    //    stack.Push(memberExpression.Expression);
                    //}
                }
                else if (item is NewExpression newExpression)
                {
                    if (!IsAnonymousType(newExpression.Type))
                        throw new NotSupportedException($"GetOperators {newExpression}");

                    foreach (var arg in newExpression.Arguments)
                        stack.Push(arg);

                    yield return (newExpression.Arguments.Count, args => Traversal.Empty);
                }
                else
                {
                    throw new NotImplementedException($"GetOperators {item}");
                    // yield return new Term($"[[{item.GetType()}]]");
                }
            }
        }

        private static IEnumerable<string> UnfoldParameter(ParameterExpression expr)
        {
            if (!IsAnonymousType(expr.Type))
                yield return expr.Name;
            else
            {
                foreach (PropertyInfo p in expr.Type.GetProperties())
                    yield return p.Name;
            }
        }

        private static bool IsAnonymousType(Type type)
        {
            return type.CustomAttributes.Select(e => e.AttributeType).Contains(typeof(CompilerGeneratedAttribute));
        }

        private static Traversal Parameter(ParameterExpression parameter)
        {
            //if (IsAnonymousType(parameter.Type))
            //    return new Compose(null, null);

            return new Select(parameter.Name).ToTraversal();
        }

        private static Traversal Lambda(Traversal[] args)
        {
            return args.Last();
            // return new Lambda(args.Take(args.Length - 1).Cast<Parameter>().ToArray(), args.Last());
        }

        private static Traversal SelectMany(Traversal[] args)
        {
            var source = args[0];
            var collection = args[1];
            var selector = args[2];

            var parameters = args[2].Parameters.Reverse().Take(2).ToArray();
            var collectionParam = parameters[0];
            var sourceParam = parameters[1];

            return source
                .Append(As(sourceParam))
                .Concat(collection)
                .Append(As(collectionParam))
                .Concat(selector);

            //var sourceParam = selector.Parameters[0];
            //var collectionParam = selector.Parameters[1];

            // if (collectionParam == selector.Body)
            //    return new Bind(source.Concat(Unfold(ToGremlin(collection))).ToArray());

            // $"{Source.ToGremlin()}.as('{sourceParam.Name}')
            //   .{ Collection.ToGremlin()}.as('{collectionParam.Name}')
            //   .{Selector.ToGremlin()}";

            // return source.Append(Helper.As(sourceParam.Name));

            //return new Bind(
            //    Unfold(source)
            //        .Concat(Unfold(As(sourceParam.Name)))
            //        .Concat(Unfold(collection))
            //        .Concat(Unfold(As(collectionParam.Name)))
            //        .Concat(Unfold(selector))
            //        .ToArray()
            //);

            // return new SelectMany(args[0], (Lambda)args[1], (Lambda)args[2]);
        }

        private static Traversal Where(Traversal source, Traversal predicate)
        {
            return source.Append(Scope("where", predicate));
            //var parameter = predicate.Parameters[0];
            // var predicate = ToGremlin(where.Predicate);
            //var (head, tail) = HeadTail(predicate);
            //if (head is Select select && select.Label.Equals(parameter.Name))
            //{
            //    if (tail == null)
            //        return source;
            //    return Bind(source, tail);
            //}
            // return new Bind(Unfold(source).Concat(new[] { As(parameter.Name), Call("where", predicate) }).ToArray());
            // return new Where((AST.Vertex)args[0], (Lambda)args[1]);
        }

        private static Traversal Binary(ExpressionType oper, Traversal left, Traversal right)
        {
            if (oper == ExpressionType.Equal)
            {
                if (left.Steps.Last() is Values values)
                {
                    var rightSteps = values.Name.Equals("id", StringComparison.OrdinalIgnoreCase) ?
                        right.Steps.Select(e => e is Const cons ? new Const(cons.Value.ToString()) : e):
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

        public static Call Relation(string name)
        {
            return new Call("out", Const(name));
        }

        public static Values Values(string name)
        {
            return new Values(name);
        }

        public static IGremlinExpr As(string name)
        {
            return new Call("as", new Const(name));
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

    public class Traversal
    {
        public IEnumerable<IGremlinExpr> Steps { get; }
        public string[] Parameters { get; }
        public GremlinSelector Selector { get; set; } = GremlinSelector.Vertex();

        public Traversal(IGremlinExpr step)
            : this(new[] { step })
        {
        }

        public Traversal(IEnumerable<IGremlinExpr> steps, params string[] parameters)
        {
            Steps = steps;
            Parameters = parameters;
        }

        public override string ToString()
        {
            return $"{string.Join(".", Steps.Select(e => e.ToString()))}";
        }

        public static readonly Traversal Empty = new Traversal(Enumerable.Empty<IGremlinExpr>(), null);
        public static readonly IGremlinExpr __ = new Context();

        public Traversal Append(IGremlinExpr expr)
        {
            return new Traversal(Steps.Append(expr)) { Selector = Selector };
        }

        public Traversal Concat(Traversal other)
        {
            return new Traversal(Steps.Concat(other.Steps))
            {
                Selector = other.Selector
            };
        }
    }

    public class GremlinSelector
    {
        private string _expression;

        public GremlinSelector(string expression)
        {
            _expression = expression;
        }

        public static GremlinSelector Vertex()
        {
            return new GremlinSelector(@"union(identity(), outE())");
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
    }
}