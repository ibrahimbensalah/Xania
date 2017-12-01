namespace Xania.CosmosDb.AST
{
    internal class Binary : IStep
    {
        private readonly string _oper;
        private readonly IStep _left;
        private readonly IStep _right;

        public Binary(string oper, IStep left, IStep right)
        {
            _oper = oper;
            _left = left;
            _right = right;
        }

        public string ToGremlin()
        {
            return $"{_oper}({_left.ToGremlin()}, {_right.ToGremlin()})";
        }

        public IStep Has(IStep step)
        {
            throw new System.NotImplementedException();
        }
    }
}