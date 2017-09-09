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
        AND = 19,
        NOT = 20,
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

                    if (propertyInfo == null)
                        throw new NotSupportedException($"Member '{name}' does not exists in {targetType}");

                    return Expression.Property(targetExpr, propertyInfo);
                case Token.NOT:
                    return Expression.Not(ToLinq(ast.expr, context));
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

        public dynamic Execute(object ast, params IContext[] contexts)
        {
            var expr = ToLinq(ast, new ContextStack (contexts));
            return Expression.Lambda(expr).Compile().DynamicInvoke();
        }
    }

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
            : this(reflectionHelper, elementParam, sourceExpr, elementType, new QueryContext(elementParam))
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
            return Select(Expression.Lambda(selectorExpr, ElementParam));
        }

        public Expression Select(LambdaExpression selectorExpr)
        {
            var selectMethod = _reflectionHelper.GetQueryableSelect(ElementType, selectorExpr.Body.Type);
            return Expression.Call(selectMethod, SourceExpr, selectorExpr);
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
                selectorExpr,
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
            Expression outerSourceExpr;
            Type outerResultType;
            {
                var outerResultTypeInfo = _reflectionHelper.CreateType(new Dictionary<string, Type>
                {
                    {"o", _outer.ElementType},
                    {"i", _inner.ElementType}
                });
                outerResultType = outerResultTypeInfo.AsType();

                var outerElementProperty = outerResultTypeInfo.DeclaredProperties.Single(p => p.Name.Equals("o"));
                var innerElementProperty = outerResultTypeInfo.DeclaredProperties.Single(p => p.Name.Equals("i"));

                var outerSelectorExpr = Expression.MemberInit(
                    Expression.New(outerResultType),
                    Expression.Bind(outerElementProperty, _outer.ElementParam),
                    Expression.Bind(innerElementProperty, _inner.ElementParam)
                );

                var joinMethod = _reflectionHelper.GetQueryableJoin(_outer.ElementType, _inner.ElementType,
                    _outerKeyExpr.Type, outerSelectorExpr.Type);

                outerSourceExpr = Expression.Call(
                    joinMethod,
                    _outer.SourceExpr,
                    _inner.SourceExpr,
                    Expression.Lambda(_outerKeyExpr, _outer.ElementParam),
                    Expression.Lambda(Expression.Convert(_innerKeyExpr, _outerKeyExpr.Type), _inner.ElementParam),
                    Expression.Lambda(outerSelectorExpr, _outer.ElementParam, _inner.ElementParam)
                );
            }

            // var outerSourceExpr = _outer.Select(Expression.Lambda(outerSelectorExpr, _outer.ElementParam, _inner.ElementParam));

            var resultParamExpr = Expression.Parameter(outerResultType);

            var resultContext = new QueryContext();
            var outerPropertyReplacement = Expression.Property(resultParamExpr, "o");
            foreach (var kvp in _outer.CreateContext())
            {
                resultContext.Add(kvp.Key, ExpressionReplacer.Replace(kvp.Value, _outer.ElementParam, outerPropertyReplacement));
            }

            var innerPropertyReplacement = Expression.Property(resultParamExpr, "i");
            foreach (var kvp in _inner.CreateContext())
            {
                resultContext.Add(kvp.Key, ExpressionReplacer.Replace(kvp.Value, _inner.ElementParam, innerPropertyReplacement));
            }

            return new Query(_reflectionHelper, resultParamExpr, outerSourceExpr, outerResultType, resultContext)
                .Join(
                    inner,
                    ExpressionReplacer.Replace(outerKeyExpr, _outer.ElementParam, outerPropertyReplacement),
//                    ExpressionReplacer.Replace(outerSelectorExpr, resultContext),
                    innerKeyExpr
                );

            // return outer.Join(inner, outerKeyExpr, innerKeyExpr);

            // throw new NotImplementedException();
        }
    }

    public class QueryContext : IContext
    {
        private readonly Dictionary<string, Expression> _values = new Dictionary<string, Expression>();

        public QueryContext(params ParameterExpression[] @params)
        {
            foreach (var p in @params)
                _values.Add(p.Name, p);
        }

        public QueryContext Add(string key, object value)
        {
            _values.Add(key, Expression.Constant(value));
            return this;
        }

        public QueryContext Add(string key, Expression expr)
        {
            _values.Add(key, expr);
            return this;
        }

        public Expression Get(string name)
        {
            Expression expr;
            if (_values.TryGetValue(name, out expr))
                return expr;

            return null;
        }

        public IEnumerator<KeyValuePair<string, Expression>> GetEnumerator()
        {
            return _values.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
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

        public IEnumerator<KeyValuePair<string, Expression>> GetEnumerator()
        {
            foreach (var ctx in _contexts)
            {
                foreach (var kvp in ctx)
                    yield return kvp;
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }

    public interface IContext: IEnumerable<KeyValuePair<string, Expression>>
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
