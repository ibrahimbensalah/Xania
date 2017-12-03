using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal abstract class GremlinExpr
    {
        public int Count { get; set; } = 0;
        public abstract IStep ToGremlin(params IStep[] args);
    }
}