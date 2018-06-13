using System.Collections.Generic;

namespace Xania.Graphs.Elements
{
    public class GraphObject : GraphValue
    {
        public ICollection<Property> Properties { get; } = new HashSet<Property>();
    }
}
