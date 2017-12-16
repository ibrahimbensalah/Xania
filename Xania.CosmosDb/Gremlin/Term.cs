using System.Collections.Generic;
using System.Linq;

namespace Xania.CosmosDb.Gremlin
{
    public class Term : IGremlinExpr
    {
        private readonly IEnumerable<IGremlinExpr> _steps;

        public Term(IEnumerable<IGremlinExpr> steps)
        {
            _steps = steps;
        }

        public override string ToString()
        {
            return string.Join(".", _steps.Select(e => e.ToString()));
        }
    }
}
