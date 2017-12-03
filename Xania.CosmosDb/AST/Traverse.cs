using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.AST
{
    internal class Traverse: IStep
    {
        public IStep Source { get; }
        public IStep Step { get; }

        public Traverse(IStep source, IStep step)
        {
            Source = source;
            Step = step;
        }

        public string ToGremlin()
        {
            return $"{Source.ToGremlin()}.{Step.ToGremlin()}";
        }

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }

    }
}
