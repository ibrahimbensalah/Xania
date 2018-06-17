namespace Xania.Graphs.Elements
{
    public abstract class GraphValue
    {
        public static readonly GraphValue Null = new GraphNull();

    }

    internal sealed class GraphNull : GraphValue
    {
        internal GraphNull () { }
    }
}
