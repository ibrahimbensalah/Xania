namespace Xania.CosmosDb.Gremlin
{
    public class Term : IGremlinExpr
    {
        private readonly string _expr;

        public Term(string expr)
        {
            _expr = expr;
        }

        public override string ToString()
        {
            return _expr;
        }
    }
}
