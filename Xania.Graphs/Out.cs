namespace Xania.Graphs
{
    public class Out : IStep
    {
        public string EdgeLabel { get; }

        public Out(string edgeLabel)
        {
            EdgeLabel = edgeLabel;
        }

        public override string ToString()
        {
            return $"out('{EdgeLabel}')";
        }
    }
}