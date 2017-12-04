using System.Linq;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class LambdaExpr : GremlinExpr
    {
        public LambdaExpr(int parametersCount)
        {
            Count = 1 + parametersCount;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            return new Lambda(args.Take(args.Length - 1).Cast<Parameter>().ToArray(), args.Last());
        }
    }
}
