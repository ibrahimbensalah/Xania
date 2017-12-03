using System.Collections.Generic;
using System.Linq;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class MemberCall : GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<IStep> Args { get; } = new List<IStep>();

        public override IStep ToGremlin(params IStep[] args)
        {
            return new AST.MemberCall(args[0], Method, Args.Concat(args.Skip(1)).ToArray());
        }
    }
}