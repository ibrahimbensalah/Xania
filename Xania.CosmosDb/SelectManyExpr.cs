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
            if (args[0] is IPipe pipe)
                return pipe.SelectMany(args[1], args[2]);
            throw new InvalidOperationException("not a pipe");
        }
    }
}