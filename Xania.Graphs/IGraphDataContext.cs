using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Xania.Graphs
{
    public interface IGraphDataContext
    {
        Task<IEnumerable<object>> ExecuteAsync(GraphTraversal traversal, Type elementType);
    }
}