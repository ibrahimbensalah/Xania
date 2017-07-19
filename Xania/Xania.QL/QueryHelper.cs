using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
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
                    return context.Get(name) ?? throw new KeyNotFoundException(name);
                case Token.MEMBER:
                    Expression targetExpr = ToLinq(ast.target, context);
                    name = (string)ast.member;
                    var targetType = targetExpr.Type;
                    var propertyInfo = targetType.GetRuntimeProperties()
                        .SingleOrDefault(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                    return Expression.Property(targetExpr, propertyInfo);
                case Token.RECORD:
                    var fields = new Dictionary<string, Expression>();
                    foreach (var binder in ast.binders)
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
                        let property = newType.DeclaredProperties.Single(p => p.Name.Equals(field.Key))
                        select Expression.Bind(property, field.Value);

                    return Expression.MemberInit(Expression.New(newType.AsType()), memberBindings);
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
                    Expression selectorExpr = ToLinq(ast.selector, query.CreateContext());
                    return query.Select(selectorExpr);
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
                    return new Query(_reflectionHelper, paramName, queryExpr, elementType);
                case Token.JOIN:
                    IQuery outerQuery = ToQuery(ast.outer, context);
                    var outerContext = outerQuery.CreateContext();
                    Query innerQuery = ToQuery(ast.inner, new ContextStack(outerContext, context));

                    var condition = ast.conditions[0];
                    var outerKeyExpr = ToLinq(condition.outerKey, outerContext);
                    var innerKeyExpr = ToLinq(condition.innerKey, innerQuery.CreateContext());

                    return outerQuery.Join(innerQuery, outerKeyExpr, innerKeyExpr);

                    // foreach (var kvp in context)
                    // innerContext.Add(kvp.Key, outerQuery.ElementType);

                    // newType.Add();

                    //    IQuery innerQuery = ToQuery(ast.inner, context);

                    //    var condition = ast.conditions[0];

                    //    var outerKeyExpr = ToLinq(condition.outerKey, outerQuery.CreateContext());
                    //    var innerKeyExpr = ToLinq(condition.innerKey, innerQuery.CreateContext());

                    //    return new JoinQuery(_reflectionHelper, outerQuery, innerQuery, outerKeyExpr, innerKeyExpr);

                    //case Token.JOIN:
                    //    Expression outerExpr = ToQuery(ast.outer, context);
                    //    var outerType = _reflectionHelper.GetElementType(outerExpr.Type);
                    //    var paramName = (string)ast.query.param;
                    //    var paramExpr = Expression.Parameter(elementType, paramName);

                    //    Expression innerExpr = ToQuery(ast.inner, context);
                    //    // var conditionExpr = ToLinq(ast.condition, context);
                    throw new InvalidOperationException();
                default:
                    throw new InvalidOperationException();
            }
        }
    }

    //internal class JoinQuery : IQuery
    //{
    //    private readonly IReflectionHelper _reflectionHelper;
    //    private readonly Query _outerQuery;
    //    private readonly IQuery _innerQuery;
    //    private readonly Expression _outerKeyExpr;
    //    private readonly Expression _innerKeyExpr;

    //    public JoinQuery(IReflectionHelper reflectionHelper, Query outerQuery, IQuery innerQuery, Expression outerKeyExpr, Expression innerKeyExpr)
    //    {
    //        _reflectionHelper = reflectionHelper;
    //        _outerQuery = outerQuery;
    //        _innerQuery = innerQuery;
    //        _outerKeyExpr = outerKeyExpr;
    //        _innerKeyExpr = innerKeyExpr;

    //        var outerContext = _outerQuery.CreateContext();
    //        var innerContext = _innerQuery.CreateContext();

    //        var unionContext = outerContext.Union(innerContext).ToArray();
    //        // var elementType = _reflectionHelper.CreateType(unionContext.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Type));

    //        // Params = _outerQuery.Params.Concat(_innerQuery.Params).ToArray();

    //        // var unionParams = _outerQuery.Params.Concat(_innerQuery.Params).ToArray();

    //        var selectorExpression = GetSelectorLambda(_outerQuery.ElementType, _innerQuery.ElementType);

    //        //var sourceExpr = Select(selectorExpr, @params);

    //        //var typeParam = Expression.Parameter(elementType.AsType(), "t");
    //        //var outParams = unionParams.Select(p => Expression.Property(typeParam, p.Name));
    //        var joinMethod = _reflectionHelper.GetQueryableJoin(_outerQuery.ElementType, _innerQuery.ElementType, _outerKeyExpr.Type, selectorExpression.Body.Type);
    //        var joinExpression = Expression.Call(null, joinMethod,
    //            _outerQuery.SourceExpr,
    //            _innerQuery.SourceExpr,
    //            Expression.Lambda(_outerKeyExpr, _outerQuery.Params),
    //            Expression.Lambda(Expression.Convert(_innerKeyExpr, _outerKeyExpr.Type), _innerQuery.Params),
    //            selectorExpression);
    //    }

    //    private LambdaExpression GetSelectorLambda(Type outerType, Type innerType)
    //    {
    //        var @params = new[]
    //        {
    //            Expression.Parameter(outerType, "t"),
    //            Expression.Parameter(innerType, "r")
    //        };
    //        var elementType = _reflectionHelper.CreateType(@params.ToDictionary(p => p.Name, p => p.Type));

    //        var selectorExpr = Expression.MemberInit(Expression.New(elementType.AsType()),
    //            @params.Select(e => Expression.Bind(elementType.DeclaredProperties.Single(x => x.Name.Equals(e.Name)), e))
    //        );
    //        return Expression.Lambda(selectorExpr, @params);
    //    }

    //    private Expression Select(MemberInitExpression selectorExpr, ParameterExpression[] @params)
    //    {
    //        var joinMethod = _reflectionHelper.GetQueryableJoin(_outerQuery.ElementType, _innerQuery.ElementType, _outerKeyExpr.Type, selectorExpr.Type);
    //        return Expression.Call(null, joinMethod,
    //            _outerQuery.SourceExpr,
    //            _innerQuery.SourceExpr,
    //            Expression.Lambda(_outerKeyExpr, _outerQuery.Params),
    //            Expression.Lambda(Expression.Convert(_innerKeyExpr, _outerKeyExpr.Type), _innerQuery.Params),
    //            Expression.Lambda(selectorExpr, @params));
    //    }

    //    // public ParameterExpression[] Params { get; }
    //    public Type ElementType { get; set; }
    //    public Expression SourceExpr { get; set; }

    //    public Expression Select(Expression selectorExpr)
    //    {
    //        var outerParam = Expression.Parameter(_outerQuery.ElementType, )

    //        var joinMethod = _reflectionHelper.GetQueryableJoin(_outerQuery.ElementType, _innerQuery.ElementType, _outerKeyExpr.Type, selectorExpr.Type);
    //        return Expression.Call(null, joinMethod, 
    //            _outerQuery.SourceExpr, 
    //            _innerQuery.SourceExpr, 
    //            Expression.Lambda(_outerKeyExpr, _outerQuery.Params),
    //            Expression.Lambda(Expression.Convert(_innerKeyExpr, _outerKeyExpr.Type), _innerQuery.Params),
    //            Expression.Lambda(selectorExpr, Params));
    //    }

    //    public IContext CreateContext()
    //    {
    //        return new ExpressionContext(Params);
    //    }
    //}

    internal interface IQuery
    {
        Expression Select(Expression selectorExpr);
        IContext CreateContext();
        IQuery Join(Query inner, Expression outerKeyExpr, Expression innerKeyExpr);
    }

    internal class Query : IQuery
    {
        private readonly IReflectionHelper _reflectionHelper;
        private readonly IContext _queryContext;
        public ParameterExpression ElementParam { get; }
        public Expression SourceExpr { get; }
        public Type ElementType { get; }

        public Query(IReflectionHelper reflectionHelper, string paramName, Expression sourceExpr, Type elementType)
            : this (reflectionHelper, Expression.Parameter(elementType, paramName), sourceExpr, elementType)
        {
        }

        public Query(IReflectionHelper reflectionHelper, ParameterExpression elementParam, Expression sourceExpr, Type elementType)
            : this(reflectionHelper, elementParam, sourceExpr, elementType, new ExpressionContext(elementParam))
        {
        }

        public Query(IReflectionHelper reflectionHelper, ParameterExpression elementParam, Expression sourceExpr, Type elementType, IContext queryContext)
        {
            if (elementType != elementParam.Type)
                throw new ArgumentException();

            _reflectionHelper = reflectionHelper;
            _queryContext = queryContext;
            SourceExpr = sourceExpr;
            ElementType = elementType;
            ElementParam = elementParam;
        }

        public Expression Select(Expression selectorExpr)
        {
            var selectMethod = _reflectionHelper.GetQueryableSelect(ElementType, selectorExpr.Type);
            return Expression.Call(selectMethod, SourceExpr, Expression.Lambda(selectorExpr, ElementParam));
        }

        public IContext CreateContext()
        {
            return _queryContext;
        }

        public IQuery Join(Query inner, Expression outerKeyExpr, Expression innerKeyExpr)
        {
            return new JoinQuery(_reflectionHelper, this, inner, outerKeyExpr, innerKeyExpr);
        }
    }

    internal class JoinQuery : IQuery
    {
        private readonly IReflectionHelper _reflectionHelper;
        private readonly Query _outer;
        private readonly Query _inner;
        private readonly Expression _outerKeyExpr;
        private readonly Expression _innerKeyExpr;

        public JoinQuery(IReflectionHelper reflectionHelper, Query outer, Query inner, Expression outerKeyExpr, Expression innerKeyExpr)
        {
            _reflectionHelper = reflectionHelper;
            _outer = outer;
            _inner = inner;
            _outerKeyExpr = outerKeyExpr;
            _innerKeyExpr = innerKeyExpr;
        }

        public Expression Select(Expression selectorExpr)
        {
            var context = CreateContext();
            var joinMethod = _reflectionHelper.GetQueryableJoin(_outer.ElementType, _inner.ElementType, _outerKeyExpr.Type, selectorExpr.Type);
            var selectorLambda = Expression.Lambda(
                ExpressionReplacer.ReplaceParameters(selectorExpr, context),
                _outer.ElementParam,
                _inner.ElementParam
            );
            return Expression.Call(
                joinMethod,
                _outer.SourceExpr,
                _inner.SourceExpr,
                Expression.Lambda(_outerKeyExpr, _outer.ElementParam),
                Expression.Lambda(Expression.Convert(_innerKeyExpr, _outerKeyExpr.Type), _inner.ElementParam),
                selectorLambda
            );
        }

        public IContext CreateContext()
        {
            return new ContextStack(_outer.CreateContext(), _inner.CreateContext());
        }

        public IQuery Join(Query inner, Expression outerKeyExpr, Expression innerKeyExpr)
        {
            var fields = new Dictionary<string, Type>();
            fields.Add("o", _outer.ElementType);
            fields.Add("i", _inner.ElementType);
            var outerResultTypeInfo = _reflectionHelper.CreateType(fields);
            var outerResultType = outerResultTypeInfo.AsType();

            var outerElementProperty = outerResultTypeInfo.DeclaredProperties.Single(p => p.Name.Equals("o"));
            var innerElementProperty = outerResultTypeInfo.DeclaredProperties.Single(p => p.Name.Equals("i"));

            var outerSelectorExpr = Expression.MemberInit(
                Expression.New(outerResultType),
                Expression.Bind(outerElementProperty, _outer.ElementParam),
                Expression.Bind(innerElementProperty, _inner.ElementParam)
            );

            var outerSourceExpr = _outer.Select(outerSelectorExpr);

            var resultParamExpr = Expression.Parameter(outerResultType);

            var outerKeyExpr2 = ExpressionReplacer.Replace(outerKeyExpr, _outer.ElementParam, Expression.Property(resultParamExpr, outerElementProperty));
            var innerKeyExpr2 = ExpressionReplacer.Replace(innerKeyExpr, _inner.ElementParam, Expression.Property(resultParamExpr, innerElementProperty));

            return new Query(_reflectionHelper, resultParamExpr, outerSourceExpr, outerResultType, new ContextStack(_outer.CreateContext(), _inner.CreateContext()))
                .Join(
                    inner,
                    outerKeyExpr2,
                    innerKeyExpr2
                );

            // return outer.Join(inner, outerKeyExpr, innerKeyExpr);

            // throw new NotImplementedException();
        }
    }

    public class ExpressionContext : Dictionary<string, Expression>, IContext
    {
        public ExpressionContext(params ParameterExpression[] @params)
        {
            foreach (var p in @params)
                Add(p.Name, p);
        }

        public Expression Get(string name)
        {
            Expression expr;
            if (TryGetValue(name, out expr))
                return expr;

            return null;
        }
    }

    public class ContextStack : IContext
    {
        private readonly IContext[] _contexts;

        public ContextStack(params IContext[] contexts)
        {
            _contexts = contexts;
        }

        public Expression Get(string name) =>
            _contexts.Select(t => t.Get(name)).FirstOrDefault(result => result != null);
    }

    public interface IContext
    {
        Expression Get(string name);
    }

    public interface IReflectionHelper
    {
        Type GetElementType(Type type);
        TypeInfo CreateType(IDictionary<string, Type> fields);
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


    //public class QueryContext : Dictionary<string, object>, IContext
    //{
    //    public QueryContext()
    //        : base(StringComparer.OrdinalIgnoreCase)
    //    {
    //    }

    //    public Expression Get(string name)
    //    {
    //        object value;
    //        return TryGetValue(name, out value)
    //            ? Expression.Constant(value)
    //            : throw new KeyNotFoundException(name);
    //    }
    //}
}
