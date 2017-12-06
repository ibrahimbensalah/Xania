namespace Xania.CosmosDb.AST
{
    public class Equal : IExpr
    {
        public string PropertyName { get; }
        public IExpr Right { get; }

        public Equal(string propertyName, IExpr right)
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