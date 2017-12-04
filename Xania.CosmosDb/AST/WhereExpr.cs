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
            if (args[0] is Vertex traversal && args[1] is Lambda lambda)
                return new Where(traversal, lambda);
            throw new InvalidOperationException($"{args[0]} where {args[1]}");
        }
    }
}