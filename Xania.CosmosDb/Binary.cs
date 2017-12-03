using System;
using System.Linq.Expressions;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class Binary : GremlinExpr
    {
        private readonly ExpressionType _oper;

        public Binary(ExpressionType oper)
        {
            _oper = oper;
            Count = 2;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            if (_oper == ExpressionType.Equal)
            {
                return args[0].Has(args[1]);
            }
            throw new NotImplementedException();
            // yield return new Term(new Vertex($"[{item.GetType()}]"));
        }
    }
}