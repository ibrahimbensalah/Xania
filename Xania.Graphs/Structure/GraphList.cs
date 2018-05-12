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

        public override IExecuteResult Execute(IStep step, IEnumerable<(string name, IExecuteResult result)> mappings)
        {
            throw new System.NotImplementedException();
        }
    }
}