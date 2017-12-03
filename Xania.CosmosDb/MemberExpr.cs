using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class MemberExpr : GremlinExpr
    {
        private readonly string _name;

        public MemberExpr(string name)
        {
            _name = name;
            Count = 1;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            return new Route(args[0], _name);
        }
    }
}