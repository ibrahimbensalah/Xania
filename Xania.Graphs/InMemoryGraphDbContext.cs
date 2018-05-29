using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Linq;

namespace Xania.Graphs
{
    public class InMemoryGraphDataContext : IGraphDataContext
    {
        private readonly Graph _graph;

        public InMemoryGraphDataContext(params object[] models)
            : this(Graph.FromObject(models))
        {
        }

        public InMemoryGraphDataContext(Graph graph)
        {
            _graph = graph;
        }

        public Task<IEnumerable<object>> ExecuteAsync(GraphTraversal traversal, Type elementType)
        {
            Console.WriteLine(traversal);

            var q =
                new VertexQuery(_graph, Expression.Constant(_graph.Vertices))
                    .Execute(traversal);

            return Task.FromResult((IEnumerable<object>) q.Execute(elementType));
        }
    }
}