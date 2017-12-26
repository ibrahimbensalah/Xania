namespace Xania.Graphs
{
    public class GremlinSelector
    {
        private readonly string _expression;

        public GremlinSelector(string expression)
        {
            _expression = expression;
        }

        public override string ToString()
        {
            return _expression;
        }
    }
}