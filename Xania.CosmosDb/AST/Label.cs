using System;

namespace Xania.CosmosDb.AST
{
    internal class Label : IStep
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

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }
    }
}