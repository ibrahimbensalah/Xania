namespace Xania.Graphs.Elements
{
    public abstract class GraphValue
    {
        public static readonly GraphNull Null = new GraphNull();

    }

    public sealed class GraphNull : GraphValue
    {
        internal GraphNull () { }
    }
}
