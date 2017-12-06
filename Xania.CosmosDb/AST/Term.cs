namespace Xania.CosmosDb.AST
{
    internal class Term
    {
        private readonly object _value;

        public Term(object value)
        {
            _value = value;
        }

        public string ToGremlin()
        {
            return _value?.ToString() ?? "null";
        }

        public IExpr SelectMany(IExpr collectionExpr, IExpr step1)
        {
            throw new System.NotImplementedException();
        }

        public static readonly IExpr __ = new ContextNode();
    }
}
