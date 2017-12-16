using System;
using System.Collections;
using System.Linq;
using System.Linq.Expressions;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class GraphQueryProvider : IQueryProvider
    {
        private readonly Client _client;

        public GraphQueryProvider(Client client)
        {
            _client = client;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            throw new NotImplementedException();
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new GraphQueryable<TElement>(this, expression);
        }

        public object Execute(Expression expression)
        {
            throw new NotImplementedException();
        }

        public TResult Execute<TResult>(Expression expression)
        {
            bool IsEnumerable = (typeof(TResult).Name == "IEnumerable`1");
            var traversal = GremlinQueryContext.Evaluate(expression);
            var gremlin = $"g.V().{traversal}.{traversal.Selector}";

            var graph = _client.GetTree(gremlin).Result;

            var resultType = typeof(IQueryable<>).MapTo(typeof(TResult));
            var elementType = resultType.GenericTypeArguments[0];

            return (TResult) OfType(graph.ToObjects(elementType), elementType);
        }

        private object OfType(IEnumerable objects, Type elementType)
        {
            var ofType = typeof(Enumerable).GetMethod("OfType")?.MakeGenericMethod(elementType);
            return ofType?.Invoke(null, new object[]{ objects });
        }
    }
}