namespace Xania.Graphs
{
    public class Alias : IStep
    {
        public string Value { get; }

        public Alias(string value)
        {
            Value = value;
        }

        public override string ToString()
        {
            return $"as('{Value}')";
        }
    }
}