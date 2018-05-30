using System;
using System.Collections.Generic;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class GraphObject : GraphValue
    {
        public ICollection<Property> Properties { get; } = new HashSet<Property>();
    }
}
