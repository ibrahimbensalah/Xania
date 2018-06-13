using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using Xania.Graphs.Linq;
using Xania.ObjectMapper;
using Xania.Reflection;

namespace Xania.Graphs.EntityFramework.Tests.Relational.Queries
{
    public class DbQueryProvider : IQueryProvider
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
            var dbExpression = Transform(expression, null);
            var func = Expression.Lambda(dbExpression).Compile();
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
                var argTypes = args.Select(a => a.Type).ToArray();

                //return instanceX != null
                //        ? Expression.Call(instanceX, m.Method.Name, argTypes, args)
                //        : Expression.Call(m.Method.DeclaringType, m.Method.Name, argTypes, args)
                //    ;

                var methodInfo = m.Method.DeclaringType.FindOverload(m.Method.Name, argTypes);

                // methodInfo.GetParameters().Select((p, idx) => Expression.Convert(args[idx]))

                return Expression.Call(instanceX, methodInfo, args);
            }
            if (expression is ConstantExpression cons)
                if (cons.Value is IQueryable<Elements.Vertex>)
                {
                    return Expression.Constant(_dbContext.Vertices);
                }
                else if (cons.Value is IQueryable<Elements.Property>)
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
                var delegateType = Transform(lambda.Type);
                
                return Expression.Lambda(delegateType, body, map2.Values);
            }

            if (expression is MemberExpression member)
            {
                var memberName = member.Member.Name;

                var instanceX = Transform(member.Expression, map);

                if (memberName.Equals("Properties"))
                {
                    var p = Expression.Parameter(typeof(Property), "p");
                    var selectorLambda = 
                        Expression.Equal(p.Property(nameof(Property.ObjectId)), instanceX.Property(nameof(Vertex.Id)))
                        // p.Property(nameof(Property.ObjectId)).Equal(instanceX.Property(nameof(Vertex.Id)))
                        .ToLambda<Func<Property, bool>>(p);

                    return Expression.Constant(_dbContext.Properties).Where(selectorLambda);

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

            if (expression is NewExpression newExpr)
            {
                var parameters = newExpr.Constructor.GetParameters();
                var bindings =
                    newExpr.Arguments.Select(e => Transform(e, map)).Zip(parameters,
                        (a, p) =>
                            Expression.ElementInit(
                                DictionaryHelper.Add<string, object>(),
                                Expression.Constant(p.Name),
                                Expression.Convert(a, typeof(object))
                            )
                    );


                return Expression.ListInit(
                    Expression.New(typeof(Dictionary<string, object>)),
                    bindings
                );
            }

            throw new NotImplementedException(expression.GetType().Name);
        }

        private Type Transform(Type type)
        {
            if (type == typeof(Elements.Vertex))
                return typeof(Vertex);

            if (type == typeof(Elements.Property))
                return typeof(Property);

            if (type == typeof(string) || type.IsPrimitive || type.IsEnum)
                return type;

            if (type.IsAnonymousType())
                return typeof(Dictionary<string, object>);

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
