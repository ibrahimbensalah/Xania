using System.Collections.Generic;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class GraphList: GraphValue
    {
        public GraphList(IList<GraphValue> items)
        {
            Items = items;
        }

        public IList<GraphValue> Items { get; }
    }
}