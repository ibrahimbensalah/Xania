using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs.Structure
{
    public class GraphList : GraphValue
    {
        public GraphList(IList<GraphValue> items)
        {
            Items = items;
        }

        public IList<GraphValue> Items { get; }

        public override object ToClType()
        {
            return Items.Select(e => e.ToClType());
        }
    }

    //public class SubGraph: GraphValue
    //{
    //    public Vertex Pivot { get; }
    //    public ICollection<(Vertex, string, Vertex)> Out { get; } = new List<(Vertex, string, Vertex)>();

    //    public SubGraph(Vertex pivot)
    //    {
    //        Pivot = pivot;
    //    }
    //}
}