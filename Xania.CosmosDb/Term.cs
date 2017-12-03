using System;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class Term : GremlinExpr
    {
        private readonly IStep _value;

        public Term(IStep value)
        {
            _value = value;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (args.Length > 0)
                throw new InvalidOperationException("Arguments not expected");

            return _value;
        }
    }
}