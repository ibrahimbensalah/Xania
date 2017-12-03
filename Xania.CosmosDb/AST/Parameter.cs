namespace Xania.CosmosDb.AST
{
    public class Parameter : IStep
    {
        public string Name { get; }
        public string Label { get; }

        public Parameter(string name, string label)
        {
            Name = name;
            Label = label;
        }

        public string ToGremlin()
        {
            // return "__";
            return $"select('{Name}')";
        }

        public IStep Has(IStep step)
        {
            throw new System.NotImplementedException();
        }
    }
}