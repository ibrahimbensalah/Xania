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

        public IStep SelectMany(IStep collectionStep, IStep step1)
        {
            throw new System.NotImplementedException();
        }

        public static readonly IStep __ = new ContextNode();
    }
}
