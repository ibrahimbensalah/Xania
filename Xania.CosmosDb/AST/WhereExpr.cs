using System;

namespace Xania.CosmosDb.AST
{
    internal class WhereExpr : GremlinExpr
    {
        public WhereExpr()
        {
            Count = 2;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (args[0] is IPipe pipe && args[1] is Lambda lambda)
                return pipe.Where(lambda);
            throw new InvalidOperationException("not a pipe");
        }
    }
}