using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.AST
{
    public class Vertex: IPipe
    {
        private readonly string _label;

        public Vertex(string label)
        {
            _label = label;
        }

        public string ToGremlin()
        {
            return $"hasLabel('{_label}')";
        }

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }

        public IStep Where(Lambda predicate)
        {
            return new Where(this, predicate);
        }

        public IStep SelectMany(IStep collectionStep, IStep selectStep)
        {
            return new Traverse(this, collectionStep);
        }
    }
}
