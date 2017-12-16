using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.Gremlin
{
    public class Context : IGremlinExpr
    {
        public override string ToString()
        {
            return "__";
        }
    }
}
