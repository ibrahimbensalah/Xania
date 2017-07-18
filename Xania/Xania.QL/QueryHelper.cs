using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Xania.QL
{
    public enum Token
    {
        WHERE = 1,
        QUERY = 2,
        IDENT = 3,
        MEMBER = 4,
        APP = 5,
        SELECT = 6,
        CONST = 7,
        RANGE = 8,
        BINARY = 9,
        AWAIT = 10,
        PIPE = 11,
        COMPOSE = 12,
        LAMBDA = 13,
        LAZY = 14,
        JOIN = 15,
        RECORD = 16,
        EQ = 17,
        OR = 18,
        AND = 19
    }

    public class QueryHelper
    {
        private readonly IReflectionHelper _reflectionHelper;

        public QueryHelper(IReflectionHelper reflectionHelper)
        {
            _reflectionHelper = reflectionHelper;
        }

        public static object accept(dynamic ast, Store store)
        {
            var type = (Token)ast.type;
            dynamic source;
            string name;
            switch (type)
            {
                case Token.IDENT:
                    name = (string)ast.name;
                    return store.Get(name);
                case Token.SELECT:
                    source = accept(ast.source, store);
                    var selector = accept(ast.selector, store);
                    return source;
                case Token.JOIN:
                    var outer = accept(ast.outer, store);
                    var inner = accept(ast.inner, store);
                    var condition = accept(ast.condition, store);
                    return outer;
                case Token.QUERY:
                    var param = (string)ast.param;
                    source = accept(ast.source, store);
                    return source;
                case Token.MEMBER:
                    var target = accept(ast.target, store);
                    name = (string)ast.name;
                    var targetType = (Type)target.GetType();
                    var propInfo = targetType
                        .GetRuntimeProperties().SingleOrDefault(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                    return propInfo.GetValue(target, null);
                default:
                    throw new InvalidOperationException("unsupported type: " + type);
            }
        }

        public static object accept(dynamic ast, Dictionary<string, object> values)
        {
            return accept(ast, new Store(values));
        }

        public Expression ToLinq(dynamic ast, IContext context)
        {
            var type = (Token)ast.type;
            string name;
            switch (type)
            {
                case Token.IDENT:
                    name = (string)ast.name;
                    return context.Get(name);
                case Token.MEMBER:
                    Expression targetExpr = ToLinq(ast.target, context);
                    name = (string)ast.member;
                    var targetType = targetExpr.Type;
                    var propertyInfo = targetType.GetRuntimeProperties()
                        .SingleOrDefault(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                    return Expression.Property(targetExpr, propertyInfo);
                case Token.RECORD:
                    var fields = new Dictionary<string, Expression>();
                    foreach(var binder in ast.binders)
                    // for (var i = 0; i < ast.binders.Length; i++)
                    {
                        // var binder = ast.binders[i];
                        name = binder.name;
                        var expr = ToLinq(binder.value, context);
                        fields.Add(name, expr);
                    }
                    var newType = _reflectionHelper.CreateType(fields.ToDictionary(e => e.Key, e => e.Value.Type));

                    var memberBindings =
                        from field in fields
                        let property = newType.GetRuntimeProperty(field.Key)
                        select Expression.Bind(property, field.Value);

                    return Expression.MemberInit(Expression.New(newType), memberBindings);
                case Token.BINARY:
                    var op = (Token)ast.op;
                    Expression left = ToLinq(ast.left, context);
                    Expression right = ToLinq(ast.right, context);

                    switch (op)
                    {
                        case Token.EQ:
                            var objectEquals = typeof(object).GetRuntimeMethod("Equals", new Type[] { typeof(object), typeof(object) });
                            return Expression.Call(null, objectEquals, Expression.Convert(left, typeof(object)), Expression.Convert(right, typeof(object)));
                        default:
                            throw new InvalidOperationException("unsupported binary operator " + op);
                    }
                case Token.SELECT:
                    IQuery query = ToQuery(ast.source, context);
                    Expression selectorExpr = ToLinq(ast.selector, new ParameterContext(query.Params));
                    return query.Select(_reflectionHelper, selectorExpr);
                default:
                    throw new InvalidOperationException("unsupported type: " + type);
            }
        }

        private IQuery ToQuery(dynamic ast, IContext context)
        {
            var type = (Token)ast.type;
            switch (type)
            {
                case Token.QUERY:
                    var queryExpr = ToLinq(ast.source, context);
                    var elementType = _reflectionHelper.GetElementType(queryExpr.Type);
                    var paramName = (string)ast.param;
                    return new Query(paramName, queryExpr, elementType);
                case Token.JOIN:
                    Query outerQuery = ToQuery(ast.outer, context);
                    Query innerQuery = ToQuery(ast.inner, context);

                    var condition = ast.conditions[0];

                    var outerKeyExpr = ToLinq(condition.outerKey, new ParameterContext(outerQuery.Params));
                    var innerKeyExpr = ToLinq(condition.innerKey, new ParameterContext(innerQuery.Params));

                    return new JoinQuery(outerQuery, innerQuery, outerKeyExpr, innerKeyExpr);
                //case Token.JOIN:
                //    Expression outerExpr = ToQuery(ast.outer, context);
                //    var outerType = _reflectionHelper.GetElementType(outerExpr.Type);
                //    var paramName = (string)ast.query.param;
                //    var paramExpr = Expression.Parameter(elementType, paramName);

                //    Expression innerExpr = ToQuery(ast.inner, context);
                //    // var conditionExpr = ToLinq(ast.condition, context);
                //    throw new InvalidOperationException();
                default: 
                    throw new InvalidOperationException();
            }
        }
    }

    internal class JoinQuery : IQuery
    {
        private readonly Query _outerQuery;
        private readonly Query _innerQuery;
        private readonly Expression _outerKeyExpr;
        private readonly Expression _innerKeyExpr;

        public JoinQuery(Query outerQuery, Query innerQuery, Expression outerKeyExpr, Expression innerKeyExpr)
        {
            _outerQuery = outerQuery;
            _innerQuery = innerQuery;
            _outerKeyExpr = outerKeyExpr;
            _innerKeyExpr = innerKeyExpr;
            Params = _outerQuery.Params.Concat(_innerQuery.Params).ToArray();
        }

        public ParameterExpression[] Params { get; }

        public Expression Select(IReflectionHelper reflectionHelper, Expression selectorExpr)
        {
            var joinMethod = reflectionHelper.GetQueryableJoin(_outerQuery.ElementType, _innerQuery.ElementType, _outerKeyExpr.Type, selectorExpr.Type);
            return Expression.Call(null, joinMethod, 
                _outerQuery.SourceExpr, 
                _innerQuery.SourceExpr, 
                Expression.Lambda(_outerKeyExpr, _outerQuery.Params),
                Expression.Lambda(Expression.Convert(_innerKeyExpr, _outerKeyExpr.Type), _innerQuery.Params),
                Expression.Lambda(selectorExpr, Params));
        }
    }

    internal interface IQuery
    {
        ParameterExpression[] Params { get; }
        Expression Select(IReflectionHelper reflectionHelper, Expression selectorExpr);
    }

    internal class Query: IQuery
    {
        public Expression SourceExpr { get; }
        public Type ElementType { get; }

        public Query(string paramName, Expression sourceExpr, Type elementType)
        {
            SourceExpr = sourceExpr;
            ElementType = elementType;
            var paramExpr = Expression.Parameter(elementType, paramName);
            Params = new[] {paramExpr};
        }

        public ParameterExpression[] Params { get; }

        public Expression Select(IReflectionHelper reflectionHelper, Expression selectorExpr)
        {
            var selectMethod = reflectionHelper.GetQueryableSelect(ElementType, selectorExpr.Type);
            return Expression.Call(selectMethod, SourceExpr, Expression.Lambda(selectorExpr, Params));
        }
    }

    internal class ParameterContext : IContext, IEnumerable<ParameterExpression>
    {
        private readonly List<ParameterExpression> _params = new List<ParameterExpression>();

        public ParameterContext(IEnumerable<ParameterExpression> @params)
        {
            _params.AddRange(@params);
        }

        public Expression Get(string name)
        {
            foreach (var param in _params)
            {
                if (param.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                    return param;
            }
            throw new KeyNotFoundException(name);
        }

        public IEnumerator<ParameterExpression> GetEnumerator()
        {
            return _params.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }

    public interface IContext
    {
        Expression Get(string name);
    }

    public interface IReflectionHelper
    {
        Type GetElementType(Type type);
        Type CreateType(IDictionary<string, Type> fields);
        MethodInfo GetQueryableSelect(Type elementType, Type resultType);
        MethodInfo GetQueryableJoin(Type outerType, Type innerType, Type keyType, Type resultType);
    }

    public class Store
    {
        private readonly IDictionary<string, object> _values;

        public Store(IDictionary<string, object> values)
        {
            _values = values;
        }
        public object Get(string name)
        {
            object value;
            return _values.TryGetValue(name, out value) ? value 
                : throw new KeyNotFoundException(name);
        }
    }


    public class QueryContext : Dictionary<string, object>, IContext
    {
        public QueryContext()
            : base(StringComparer.OrdinalIgnoreCase)
        {
        }

        public Expression Get(string name)
        {
            object value;
            return TryGetValue(name, out value)
                ? Expression.Constant(value)
                : throw new KeyNotFoundException(name);
        }
    }
}
