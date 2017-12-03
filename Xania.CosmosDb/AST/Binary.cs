namespace Xania.CosmosDb.AST
{
    public class Binary : IStep
    {
        public string Oper { get; }
        public IStep Left { get; }
        public IStep Right { get; }

        public Binary(string oper, IStep left, IStep right)
        {
            Oper = oper;
            Left = left;
            Right = right;
        }

        public string ToGremlin()
        {
            return $"{Oper}({Left.ToGremlin()}, {Right.ToGremlin()})";
        }

        public IStep Has(IStep step)
        {
            throw new System.NotImplementedException();
        }
    }
}