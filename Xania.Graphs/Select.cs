namespace Xania.Graphs
{
    public class Select: IStep
    {
        public string Label { get; }

        public Select(string label)
        {
            Label = label;
        }

        public override string ToString()
        {
            return $"select('{Label}')";
        }
    }
}
