using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xania.Reflection;

namespace Xania.Graphs.Structure
{
    public class GraphObject : GraphValue
    {
        public HashSet<Property> Properties { get; } = new HashSet<Property>();

        public override object ToClType()
        {
            var dict = new Dictionary<string, object>();
            ToClType(dict);
            return dict;
        }

        protected void ToClType(IDictionary<string, object> dict)
        {
            foreach (var v in Properties.Select(e => new KeyValuePair<string, object>(e.Name, e.Value.ToClType())))
                dict.Add(v.Key, v.Value);
        }
    }
}
