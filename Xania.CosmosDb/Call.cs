using System.Collections.Generic;
using System.Linq;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class Call : GremlinExpr
    {
        public string Method { get; set; }
        public ICollection<IStep> Args { get; } = new List<IStep>();
        public override IStep ToGremlin(params IStep[] args)
        {
            return new AST.MemberCall(null, Method, Args.Concat(args).ToArray());
        }
    }
}