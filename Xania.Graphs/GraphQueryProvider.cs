using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xania.Reflection;

namespace Xania.Graphs
{
    public class GraphQueryProvider : IQueryProvider
    {
        private readonly IGraphDataContext _client;

        public GraphQueryProvider(IGraphDataContext client)
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

            var resultType = typeof(IQueryable<>).MapTo(typeof(TResult));
            var elementType = resultType.GenericTypeArguments[0];

            //var items = _client.ExecuteGremlinAsync(gremlin).Result.OfType<JObject>()
            //    .Select(result => Client.ConvertToObject(result, elementType));
            var items = _client.ExecuteGremlinAsync(traversal, elementType).Result;

            return (TResult) resultType.CreateCollection(items.ToArray());
        }
    }

    public interface IGraphDataContext
    {
        Task<IEnumerable<object>> ExecuteGremlinAsync(GraphTraversal traversal, Type elementType);
    }
}