using System;

namespace Xania.CosmosDb.AST
{
    internal class Label : IExpr
    {
        private readonly string paramName;

        public Label(string paramName)
        {
            this.paramName = paramName;
        }

        public string ToGremlin()
        {
            return paramName;
        }
    }
}