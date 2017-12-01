using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.AST
{
    internal class Traverse: IPipe
    {
        private readonly IPipe _source;
        private readonly IStep _step;

        public Traverse(IPipe source, IStep step)
        {
            _source = source;
            _step = step;
        }

        public string ToGremlin()
        {
            return $"{_source.ToGremlin()}:{_step.ToGremlin()}";
        }

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }

        public IStep Where(IStep predicate)
        {
            throw new NotImplementedException();
        }

        public IStep SelectMany(IStep step, IStep step1)
        {
            throw new NotImplementedException();
        }

        public IPipe Inverse()
        {
            throw new NotImplementedException();
        }
    }
}
