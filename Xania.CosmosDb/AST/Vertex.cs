using System;

namespace Xania.CosmosDb.AST
{
    public class Vertex: IExpr
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

    public class ContextNode : IExpr
    {
        public string ToGremlin()
        {
            return "__";
        }
    }
}
