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
using ParameterExpression = System.Linq.Expressions.ParameterExpression;

namespace Xania.Graphs.Linq
{
    public class GraphExpressionMap
    {
        public GraphTypeMap TypeMap { get; }

        public GraphExpressionMap(GraphTypeMap typeMap)
        {
            TypeMap = typeMap;
        }

        private IDictionary<ParameterExpression, ParameterExpression> ExpressionMap { get; } = new Dictionary<ParameterExpression, ParameterExpression>();

        public Expression GetGraphExpression(Expression key)
        {
            if (key is ParameterExpression param)
            {
                if (ExpressionMap.TryGetValue(param, out var value))
                    return value;

                var graphType = TypeMap.GetGraphType(param.Type);
                var graphParam = Expression.Parameter(graphType, "g_"+param.Name);
                ExpressionMap.Add(param, graphParam);
                return graphParam;
            }

            return null;
        }
    }

    public class GraphTypeMap
    {
        private IDictionary<Type, Type> Dict { get; } = new Dictionary<Type, Type>();

        public Type GetGraphType(Type key)
        {
            if (Dict.TryGetValue(key, out var value))
                return value;

            var graphType = ToGraphType(key);
            Dict.Add(key, graphType);
            return graphType;
        }

        public void Map(Type from, Type to)
        {
            if (!Dict.TryGetValue(from, out var existing))
                Dict.Add(from, to);
            else if (existing != to)
            {
                throw new InvalidOperationException();
            }
        }

        private Type ToGraphType(Type itemType)
        {
            if (itemType.IsPrimitive())
                return typeof(GraphPrimitive);
            if (itemType.IsComplexType())
                return typeof(GraphValue);
            if (itemType.IsAnonymousType())
                throw new InvalidOperationException($"ToGraphType {itemType.Name}");
            else
                return typeof(Vertex);
        }

        public bool TryGetValue(Type type, out Type graphType)
        {
            return Dict.TryGetValue(type, out graphType);
        }
    }

    //public class SelectManyResultMap : IMap<Expression, Expression>
    //{
    //    public Type SourceType { get; }
    //    public Type GraphSourceType { get; }
    //    public IDictionary<ParameterExpression, ParameterExpression> Dict { get; }

    //    public SelectManyResultMap(Type sourceType, Type graphSourceType)
    //    {
    //        SourceType = sourceType;
    //        GraphSourceType = graphSourceType;
    //        Dict = new Dictionary<ParameterExpression, ParameterExpression>();
    //    }

    //    public Expression GetValue(Expression key)
    //    {
    //        if (key is ParameterExpression parameter)
    //        {
    //            if (Dict.TryGetValue(parameter, out var result))
    //                return result;

    //            var graphParam = Expression.Parameter(ToGraphType(parameter.Type), parameter.Name);
    //            Dict.Add(parameter, graphParam);

    //            return graphParam;
    //        }

    //        return null;
    //    }

    //    private Type ToGraphType(Type itemType)
    //    {
    //        if (itemType.IsPrimitive())
    //            return typeof(GraphPrimitive);
    //        if (itemType.IsComplexType())
    //            return typeof(GraphValue);
    //        else
    //            return typeof(Vertex);
    //    }
    //}

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
            var graphExpression = ToGraphExpression(expression, new GraphExpressionMap(new GraphTypeMap()));
            Console.WriteLine(graphExpression);
            var func = Expression.Lambda(graphExpression).Compile();

            var result = func.DynamicInvoke();
            Console.WriteLine("GraphQueryProfile.Execute result:");
            Console.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));
            Console.WriteLine("********************************************");
            var mapper = new Mapper(new GraphMappingResolver(_graph));
            return mapper.MapTo<TResult>(result);
        }

        public TResult Execute<TResult>(Expression expression, GraphExpressionMap expressionMap)
        {
            var graphExpression = ToGraphExpression(expression, expressionMap);
            var func = Expression.Lambda<Func<TResult>>(graphExpression).Compile();
            return func();
        }

        public Expression ToGraphExpression(Expression expression, GraphExpressionMap expressionMap)
        {
            if (expression is null)
                return null;

            var result = expressionMap?.GetGraphExpression(expression);
            if (result != null) return result;

            switch (expression)
            {
                case MethodCallExpression methodCall:
                    return ToGraphExpression(methodCall, expressionMap);
                case ConstantExpression cons:
                    return ToGraphExpression(cons);
                case UnaryExpression unary:
                    return ToGraphExpression(unary.Operand, expressionMap);
                case LambdaExpression lambda:
                    return ToGraphExpression(lambda, expressionMap);
                case BinaryExpression binary:
                    return ToGraphExpression(binary, expressionMap);
                case MemberExpression member:
                    return ToGraphExpression(member, expressionMap);
                case NewExpression newExpr:
                    return ToGraphExpression(newExpr, expressionMap);
            }

            throw new NotSupportedException(expression.GetType().Name);
        }

        private readonly RuntimeReflectionHelper reflectionHelper = new RuntimeReflectionHelper();
        private Expression ToGraphExpression(NewExpression newExpr, GraphExpressionMap expressionMap)
        {
            var fields =
                    newExpr.Constructor.GetParameters()
                        .Zip(newExpr.Arguments,
                            (param, argExpr) => (Name: param.Name,
                                Expression: ToGraphExpression(argExpr, expressionMap))).ToArray()
                ;

            Type typeInfo;
                if (expressionMap.TypeMap.TryGetValue(newExpr.Type, out var existing))
                    typeInfo = existing;
            else
            {
                typeInfo = reflectionHelper.CreateType(
                    fields.Select(p => new KeyValuePair<string, Type>(p.Name, p.Expression.Type))
                );
                expressionMap.TypeMap.Map(newExpr.Type, typeInfo);
            }

            var bindings =
                from property in typeInfo.GetProperties()
                join field in fields on property.Name equals field.Name
                select Expression.Bind(property, Convert(field.Expression, property.PropertyType));

            return Expression.MemberInit(
                Expression.New(typeInfo),
                bindings
            );
        }

        private Expression ToGraphExpression(MemberExpression memberExpr, GraphExpressionMap expressionMap)
        {
            var ignore = StringComparison.InvariantCultureIgnoreCase;
            var (members, instanceExpr) = Split(memberExpr);

            if (members.Length == 0)
            {
                var member = memberExpr.Member;
                var gx = ToGraphExpression(memberExpr.Expression, expressionMap);
                var property = gx.Type.GetProperty(member.Name);
                if (property != null)
                {
                    return Expression.Property(gx, property);
                }

                var edgeLabel = member.Name;
                var vertexLabel = member.DeclaringType.Name;

                var edgeParam = Expression.Parameter(typeof(Edge), "edge");
                var edgeLambda = edgeParam.Property(nameof(Edge.Label)).StringEqual(edgeLabel).ToLambda(edgeParam);

                var vertexParam = Expression.Parameter(typeof(Vertex), "vertex");
                var vertexLambda = vertexParam.Property(nameof(Structure.Vertex.Label)).StringEqual(vertexLabel).ToLambda(vertexParam);

                return gx.OutE(_graph.Edges).Where(edgeLambda)
                    .InV(_graph.Vertices).Where(vertexLambda);
            }
            else
            {
                var vertexExpr = ToGraphExpression(instanceExpr, expressionMap);

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

        private Expression ToGraphExpression(BinaryExpression binary, GraphExpressionMap expressionMap)
        {
            var left = ToGraphExpression(binary.Left, expressionMap);
            var right = ToGraphExpression(binary.Right, expressionMap);

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
            if (expression.Type == type)
                return expression;

            if (expression is ConstantExpression cons)
            {
                var converter = TypeDescriptor.GetConverter(type);
                var converted = converter.ConvertTo(cons.Value, type);
                return Expression.Constant(converted);
            }

            if (expression.Type == typeof(IEnumerable<GraphValue>))
            {
                if (type == typeof(IEnumerable<GraphPrimitive>))
                {
                    return expression.OfType<GraphPrimitive>();
                }

                if (type == typeof(GraphPrimitive))
                {
                    return expression.OfType<GraphPrimitive>().FirstOrDefault();
                }
            }

            throw new NotImplementedException($"Convert {expression.Type.Name} -> {type.Name}");
        }

        private Expression ToGraphExpression(LambdaExpression lambda, GraphExpressionMap expressionMap)
        {
            var parameters = lambda.Parameters.Select(expressionMap.GetGraphExpression).Cast<ParameterExpression>().ToArray();
            var body = ToGraphExpression(lambda.Body, expressionMap);
            return Expression.Quote(Expression.Lambda(body, parameters));
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

        private Expression ToGraphExpression(MethodCallExpression methodCall, GraphExpressionMap expressionMap)
        {
            var methodInfo = methodCall.Method;

            var arguments = methodCall.Arguments.Select(a => ToGraphExpression(a, expressionMap)).ToArray();
            var instanceX = ToGraphExpression(methodCall.Object, expressionMap);
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