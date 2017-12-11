using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.Gremlin
{
    public class Select: IGremlinExpr
    {
        public string Label { get; }

        public Select(string label)
        {
            Label = label;
        }

        public override string ToString()
        {
            return $"select('{Label}')";
        }
    }
}
