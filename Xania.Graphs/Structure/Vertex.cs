using System;
using Xania.Graphs.Gremlin;

namespace Xania.Graphs.Structure
{
    public class Vertex : GraphObject
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Label { get; set; }

        public Vertex(string label)
        {
            Label = label.ToCamelCase();
        }

        public override string ToString()
        {
            return $"V['{Id}']";
        }
    }
}