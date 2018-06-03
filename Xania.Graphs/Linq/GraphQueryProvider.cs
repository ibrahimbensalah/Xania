using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Newtonsoft.Json;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Structure;
using Xania.Reflection;
using Xania.ObjectMapper;

namespace Xania.Graphs.Linq
{
    public interface IMap<in TKey, out TValue>
    {
        TValue GetValue(TKey key, out bool found);
    }

    public class ExpressionMap<TValue> : IMap<Expression, TValue>
    {
        private readonly Dictionary<Expression, TValue> _dict;

        public ExpressionMap(Dictionary<Expression, TValue> dict)
        {
            _dict = dict;
        }

        public void Add(Expression key, TValue value)
        {
            _dict.Add(key, value);
        }

        public TValue GetValue(Expression key, out bool found)
        {
            found = _dict.TryGetValue(key, out var result);
            return result;
        }
    }

    public class GraphQueryProvider : IQueryProvider
    {
        private readonly Graph _graph;

        public GraphQueryProvider(Graph graph)
        {
            _graph = graph;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            throw new NotImplementedException();
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new GenericQueryable<TElement>(this, expression);
        }

        public object Execute(Expression expression)
        {
            throw new NotImplementedException();
        }

        public TResult Execute<TResult>(Expression expression)
        {
            var graphExpression = ToGraphExpression(expression, null);
            Console.WriteLine(graphExpression);
            var func = Expression.Lambda(graphExpression).Compile();

            var result = func.DynamicInvoke();
            Console.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));
            var mapper = new Mapper(new GraphMappingResolver(_graph));
            return mapper.MapTo<TResult>(result);
        }

        public TResult Execute<TResult>(Expression expression, IMap<Expression, Expression> dict)
        {
            var graphExpression = ToGraphExpression(expression, dict);
            var func = Expression.Lambda<Func<TResult>>(graphExpression).Compile();
            return func();
        }

        public Expression ToGraphExpression(Expression expression, IMap<Expression, Expression> map)
        {
            if (expression is null)
                return null;

            if (map != null)
            {
                var result = map.GetValue(expression, out var found);
                if (found) return result;
            }

            switch (expression)
            {
                case MethodCallExpression methodCall:
                    return ToGraphExpression(methodCall, map);
                case ConstantExpression cons:
                    return ToGraphExpression(cons);
                case UnaryExpression unary:
                    return ToGraphExpression(unary.Operand, map);
                case LambdaExpression lambda:
                    return ToGraphExpression(lambda);
                case BinaryExpression binary:
                    return ToGraphExpression(binary, map);
                case MemberExpression member:
                    return ToGraphExpression(member, map);
                case NewExpression newExpr:
                    return ToGraphExpression(newExpr, map);
            }

            throw new NotSupportedException(expression.GetType().Name);
        }

        private Expression ToGraphExpression(NewExpression newExpr, IMap<Expression, Expression> map)
        {
            var dictAdd = DictionaryHelper.Add<string, object>();
            var items =
                    newExpr.Constructor.GetParameters()
                        .Select(e => e.Name.ToCamelCase())
                        .Zip(newExpr.Arguments,
                            (paramName, argExpr) =>
                                Expression.ElementInit(
                                    dictAdd,
                                    Expression.Constant(paramName),
                                    ToGraphExpression(argExpr, map).Box()
                                )
                        )
                ;

            return Expression.ListInit(
                Expression.New(typeof(Dictionary<string, object>)),
                items
            );
        }

        private Expression ToGraphExpression(MemberExpression memberExpr, IMap<Expression, Expression> map)
        {
            var ignore = StringComparison.InvariantCultureIgnoreCase;
            var (members, instanceExpr) = Split(memberExpr);

            if (members.Length == 0)
            {
                var member = memberExpr.Member;
                // var outV = ToGraphExpression(memberExpr.Expression, map); // .Where((Vertex v) => v.Label.Equals(member.Name, StringComparison.InvariantCultureIgnoreCase));
                return
                    ToGraphExpression(memberExpr.Expression, map)
                        .OutE(_graph.Edges).Where((Edge e) => e.Label.Equals(member.Name, ignore))
                        .InV(_graph.Vertices).Where((Vertex v) => v.Label.Equals(member.DeclaringType.Name, ignore));
            }
            else
            {
                var vertexExpr = ToGraphExpression(instanceExpr, map);

                if (members.Length == 1)
                {
                    var member = members[0];
                    if (member.Name.Equals("Id", StringComparison.InvariantCultureIgnoreCase))
                    {
                        var v = Expression.Parameter(typeof(Vertex), "v");
                        var selectExpr = vertexExpr.Select(Expression.Lambda(v.Property("Id").Convert(memberExpr.Type), v));

                        if (!memberExpr.Type.IsEnumerable() && selectExpr.Type.IsEnumerable())
                            return selectExpr.FirstOrDefault();

                        return selectExpr;
                    }
                }

                var firstMember = members[0].Name;
                var vertexProperties =
                        vertexExpr.Property(nameof(GraphObject.Properties))
                            .Where((Property p) => p.Name.Equals(firstMember, ignore))
                            .Select((Property p) => p.Value)
                    ;

                var result = members.Skip(1).Select(m => m.Name).Aggregate(
                    vertexProperties,
                    (values, propertyName) =>
                        values.OfType<GraphObject>()
                            .SelectMany((GraphObject obj) =>
                                obj.Properties.Where(p => p.Name.Equals(propertyName, ignore)))
                            .Select((Property p) => p.Value)
                );

                if (memberExpr.Type.IsEnumerable())
                    return result.OfType<GraphList>().SelectMany((GraphList l) => l.Items);

                return result;
            }
        }

        private Expression ToGraphExpression(BinaryExpression binary, IMap<Expression, Expression> map)
        {
            var left = ToGraphExpression(binary.Left, map);
            var right = ToGraphExpression(binary.Right, map);

            if (left.Type == right.Type)
                return Expression.MakeBinary(binary.NodeType, left, right);

            if (left is MemberExpression mem && mem.Member.Name.Equals("Id", StringComparison.InvariantCultureIgnoreCase))
            {
                return Expression.MakeBinary(binary.NodeType, left, Convert(right, left.Type));
            }

            if (right is ConstantExpression cons)
            {
                if (typeof(IEnumerable<GraphValue>).MapFrom(left.Type) != null)
                {
                    return
                        left.OfType<GraphPrimitive>()
                            .Select((GraphPrimitive prim) => prim.Value)
                            .OfType(cons.Type)
                            .Contains(cons)
                        ;
                }

                if (typeof(IEnumerable<>).MapFrom(left.Type) != null)
                {
                    return left.Contains(cons);
                }
            }

            throw new NotSupportedException($"{left.Type.Name} == {right.Type.Name}");
        }

        private Expression Convert(Expression expression, Type type)
        {
            if (expression is ConstantExpression cons)
            {
                var converter = TypeDescriptor.GetConverter(type);
                var converted = converter.ConvertTo(cons.Value, type);
                return Expression.Constant(converted);
            }

            throw new NotImplementedException($"Convert {expression.Type.Name} -> {type.Name}");
        }

        private Expression ToGraphExpression(LambdaExpression lambda)
        {
            var dict = lambda.Parameters.ToDictionary(
                p => p as Expression,
                p => Expression.Parameter(ToGraphType(p.Type))
            );
            var map = new ExpressionMap<ParameterExpression>(dict);
            var body = ToGraphExpression(lambda.Body, map);
            return Expression.Quote(Expression.Lambda(body, dict.Values));
        }

        private Type ToGraphType(Type itemType)
        {
            if (itemType.IsPrimitive())
                return typeof(GraphPrimitive);
            if (itemType.IsComplexType())
                return typeof(GraphValue);
            else
                return typeof(Vertex);
        }

        private Expression ToGraphExpression(ConstantExpression cons)
        {
            if (cons.Type == typeof(string) || cons.Type.IsPrimitive)
                return cons;

            var enumerableType = typeof(IEnumerable<>).MapFrom(cons.Type);
            if (enumerableType != null)
            {
                var itemType = enumerableType.GenericTypeArguments[0];
                if (!itemType.IsPrimitive() && !itemType.IsComplexType())
                {
                    var itemLabel = itemType.Name.ToLower();


                    var v = Expression.Parameter(typeof(Vertex), "v");
                    var predicate = v.Property(nameof(Structure.Vertex.Label)).StringEqual(Expression.Constant(itemLabel)).ToLambda<Func<Vertex, bool>>(v);

                    var vertices = _graph.Vertices.Where(predicate);
                    return Expression.Constant(vertices);
                }
            }

            throw new NotSupportedException(cons.Type.Name);
        }

        private Expression ToGraphExpression(MethodCallExpression methodCall, IMap<Expression, Expression> map)
        {
            var instanceX = ToGraphExpression(methodCall.Object, map);
            var arguments = methodCall.Arguments.Select(a => ToGraphExpression(a, map)).ToArray();
            var methodInfo = methodCall.Method;
            var argTypes = arguments.Select(a => a.Type).ToArray();
            var overload = methodInfo.DeclaringType.FindOverload(methodInfo.Name, argTypes);

            return Expression.Call(instanceX, overload, arguments);
        }

        private static (MemberInfo[] members, Expression instanceExpr) Split(MemberExpression memberExpression)
        {
            var elementType = GetElementType(memberExpression.Type);
            var isValues = elementType.IsPrimitive() || elementType.IsComplexType();
            if (isValues)
            {
                var instanceExpr = memberExpression.Expression;
                if (instanceExpr is MemberExpression parentExpression)
                {
                    var p = Split(parentExpression);
                    return (p.members.Append(memberExpression.Member).ToArray(), p.instanceExpr);
                }

                return (new[] { memberExpression.Member }, instanceExpr);
            }
            else
            {
                return (new MemberInfo[0], memberExpression);
            }
        }

        private static Type GetElementType(Type type)
        {
            if (type == typeof(string))
                return type;
            return type.GetItemType() ?? type;
        }

        public static Out Out(string edgeLabel, Type type, bool many)
        {
            return new Out(edgeLabel, type, many);
        }

        public static Values Values(string name, Type type)
        {
            return new Values(name, type);
        }

        public static IStep As(string name, Type type)
        {
            if (type.IsAnonymousType())
                return null;

            return new Alias(name, type);
        }

        public static Const Const(object value)
        {
            return new Const(value);
        }

        public static GraphTraversal Vertex(Type type)
        {
            return new GraphTraversal(new V(type));
        }
    }
}