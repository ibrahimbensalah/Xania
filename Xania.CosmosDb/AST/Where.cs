using System;
using Microsoft.Azure.Graphs;

namespace Xania.CosmosDb.AST
{
    internal class Where : IStep
    {
        private readonly IStep _source;
        private readonly IStep _predicate;

        public Where(IStep source, IStep predicate)
        {
            _source = source;
            _predicate = predicate;
        }

        public string ToGremlin()
        {
            if (_predicate is IPipe pipe)
                return $"{pipe.ToGremlin()}.in({_source.ToGremlin()})";
            return $"{_source.ToGremlin()}.where({_predicate.ToGremlin()})";
        }

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }
    }
}
