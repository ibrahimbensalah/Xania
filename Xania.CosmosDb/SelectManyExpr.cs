using System;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class SelectManyExpr : GremlinExpr
    {
        public SelectManyExpr()
        {
            Count = 3;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (args[1] is Lambda collection && args[2] is Lambda selector)
            {
                return new SelectMany(args[0], collection, selector);
            }
            throw new InvalidOperationException("not a pipe");
        }
    }
}
