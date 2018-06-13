using System.Collections.Generic;
using System.Linq;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Elements
{
    public class GraphList: GraphValue
    {
        public GraphList(IEnumerable<GraphValue> items)
        {
            Items = items.ToArray();
        }

        public GraphList()
        {
            Items = new List<GraphValue>();
        }

        public IList<GraphValue> Items { get; }
    }
}