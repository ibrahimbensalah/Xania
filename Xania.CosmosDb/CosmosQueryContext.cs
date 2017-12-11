using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.CompilerServices;
using Xania.CosmosDb.Gremlin;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class CosmosQueryContext
    {
        public static string ToGremlin(Expression expression)
        {
            var trav = Evaluate(expression);
            return $"g.V().{trav}.{GetSelector(trav)}";
            // return $"g.V().{step.ToGremlin()}.{GetGremlinSelector(step)}";
        }

        private static string GetSelector(Traversal trav)
        {
            return $"union(identity(), outE())";
        }

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
                        yield return (2, args => Where(args[0].Append(As(lambda.Parameters[0].Name)), args[1]));
                    }
                    else if (methodName.Equals("SelectMany"))
                    {
                        foreach(var arg in methodCall.Arguments)
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
                    var parameters = lambda.Parameters.Select(e => e.Name).ToArray();
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
                        yield return (0, args => null);
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

            var sourceParam = args[1].Parameters[0];
            var collectionParam = args[2].Parameters[1];

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
            // return Call("has", Const(equal.PropertyName), ToGremlin(equal.Right));
            if (oper == ExpressionType.Equal)
            {
                if (left.Steps.Last() is Values values)
                    return new Traversal(left.Steps.Take(left.Steps.Count() - 1)).Append(new Call("has", right.Steps.Prepend(new Const(values.Name))));

                return left.Append(new Call("has", right.Steps));
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

        public static IGremlinExpr Term(string value)
        {
            return new Term(value);
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
            return string.Join(".", Steps.Select(e => e.ToString()));
        }

        public static readonly Traversal Empty = new Traversal(Enumerable.Empty<IGremlinExpr>());

        public Traversal Append(IGremlinExpr expr)
        {
            return new Traversal(Steps.Append(expr));
        }

        public Traversal Concat(Traversal other)
        {
            return new Traversal(Steps.Concat(other.Steps));
        }
    }
}