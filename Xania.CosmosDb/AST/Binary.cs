namespace Xania.CosmosDb.AST
{
    public class Has : IStep
    {
        public string PropertyName { get; }
        public IStep Right { get; }

        public Has(string propertyName, IStep right)
        {
            PropertyName = propertyName;
            Right = right;
        }

        public string ToGremlin()
        {
            return $"has('{PropertyName}', {Right.ToGremlin()})";
        }
    }
}