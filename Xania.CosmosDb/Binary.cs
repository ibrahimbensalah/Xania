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
            if (args[0] is Member member && _oper == ExpressionType.Equal)
            {
                var binary = new Has(member.Name, args[1]);
                return new Traverse(member.Target, binary);
            }
            throw new NotImplementedException();
        }
    }
}