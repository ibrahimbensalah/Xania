using System;

namespace Xania.CosmosDb.AST
{
    public class Vertex: IStep
    {
        public string Label { get; }

        public Vertex(string label)
        {
            Label = label;
        }

        public string ToGremlin()
        {
            return $"hasLabel('{Label}')";
        }

    }

    public class ContextNode : IStep
    {
        public string ToGremlin()
        {
            return "__";
        }
    }
}
