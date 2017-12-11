using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.Gremlin
{
    public class Values : IGremlinExpr
    {
        public string Name { get; }

        public Values(string name)
        {
            Name = name;
        }

        public override string ToString()
        {
            return $"values('{Name}')";
        }
    }
}
