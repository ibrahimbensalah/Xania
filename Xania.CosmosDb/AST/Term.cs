namespace Xania.CosmosDb.AST
{
    internal class Term : IPipe
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

        public IStep Has(IStep step)
        {
            throw new System.NotImplementedException();
        }

        public IStep Where(Lambda predicate)
        {
            return new Where(this, predicate);
        }

        public IStep SelectMany(IStep collectionStep, IStep step1)
        {
            throw new System.NotImplementedException();
        }

        public IPipe Inverse()
        {
            throw new System.NotImplementedException();
        }
    }
}
