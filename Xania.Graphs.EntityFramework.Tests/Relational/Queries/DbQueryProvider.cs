using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using Xania.Graphs.Linq;
using Xania.ObjectMapper;

namespace Xania.Graphs.EntityFramework.Tests.Relational.Queries
{
    public class DbQueryProvider: IQueryProvider
    {
        private readonly GraphDbContext _dbContext;

        public DbQueryProvider(GraphDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            throw new NotImplementedException();
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new DbQueryable<TElement>(this, expression);
        }

        public object Execute(Expression expression)
        {
            throw new NotImplementedException();
        }

        public TResult Execute<TResult>(Expression expression)
        {
            var func = Expression.Lambda(Transform(expression, null)).Compile();
            var result = func.DynamicInvoke();
            return result.MapTo<TResult>();
        }

        private Expression Transform(Expression expression, IReadOnlyDictionary<ParameterExpression, ParameterExpression> map)
        {
            if (expression == null)
                return null;
            if (expression is MethodCallExpression m)
            {
                var instanceX = Transform(m.Object, map);
                var args = m.Arguments.Select(expression1 => Transform(expression1, map)).ToArray();
                //if (m.Method.Name.Equals("SelectMany") && m.Method.DeclaringType == typeof(Queryable))
                //{
                //    var unaryX = args[1] as UnaryExpression;
                //    return args[0].SelectMany(unaryX.Operand as LambdaExpression);
                //}

                var method = Transform(m.Method);
                return Expression.Call(instanceX, method, args);
            }
            if (expression is ConstantExpression cons)
                if (cons.Value is IQueryable<Structure.Vertex>)
                {
                    return Expression.Constant(_dbContext.Vertices);
                }
                else if (cons.Value is IQueryable<Structure.Property>)
                {
                    return Expression.Constant(_dbContext.Properties);
                }
                else
                {
                    return expression;
                }
            if (expression is UnaryExpression unary)
                return Expression.MakeUnary(unary.NodeType, Transform(unary.Operand, map), Transform(unary.Type));
            if (expression is LambdaExpression lambda)
            {
                var map2 = lambda.Parameters.ToDictionary(p => p, p => Expression.Parameter(Transform(p.Type), p.Name));
                var body = Transform(lambda.Body, map2);

                return Expression.Lambda(body, map2.Values);
            }

            if (expression is MemberExpression member)
            {
                var memberName = member.Member.Name;

                var instanceX = Transform(member.Expression, map);

                if (memberName.Equals("Properties"))
                {
                    var p = Expression.Parameter(typeof(Property), "p");
                    var selectorLambda = p.Property(nameof(Property.ObjectId)).StringEqual(instanceX.Property(nameof(Vertex.Id)))
                        .ToLambda<Func<Property, bool>>(p);

                    return Expression.Constant(_dbContext.Properties.Where(selectorLambda));

                    //return instanceX.SelectMany((Vertex v) => 
                    //    _dbContext.Properties.Where(p => p.ObjectId == v.Id));
                    // return Expression.Convert(properties, typeof(IEnumerable<Relational.Property>));
                }

                return Expression.Property(instanceX, memberName);
            }

            if (expression is ParameterExpression param)
                if (map != null && map.TryGetValue(param, out var o))
                {
                    return o;
                }
                else
                {
                    return param;
                }


            throw new NotImplementedException(expression.GetType().Name);
        }

        public Expression<Func<TSource, TResult>> Projection<TSource, TResult>(Expression<Func<TSource, TResult>> expr)
        {
            return expr;
        }

        private MethodInfo Transform(MethodInfo method)
        {
            if (method.DeclaringType == typeof(Queryable))
            {
                var def = method.GetGenericMethodDefinition();
                var typeArguments = method.GetGenericArguments()
                        .Select(Transform)
                        .ToArray()
                    ;
                return def.MakeGenericMethod(typeArguments);
            }
            else if (method.Name == "Equals")
            {
                return method;
            }
            throw new NotImplementedException(method.Name);
        }

        private Type Transform(Type type)
        {
            if (type == typeof(Structure.Vertex))
                return typeof(Vertex);

            if (type == typeof(Structure.Property))
                return typeof(Property);

            if (type == typeof(string) || type.IsPrimitive || type.IsEnum)
                return type;

            if (type.IsGenericType)
            {
                var def = type.GetGenericTypeDefinition();
                var args = type.GenericTypeArguments.Select(Transform).ToArray();

                return def.MakeGenericType(args);
            }

            throw new NotImplementedException(type.Name);
        }
    }
}
