using System;
using Xania.Graphs.Gremlin;

namespace Xania.Graphs.Elements
{
    public class Edge
    {
        public string Label { get; }
        public string OutV { get; set; }
        public string InV { get; set; }
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public Edge(string outV, string name, string inV)
        {
            OutV = outV;
            InV = inV;
            Label = name.ToCamelCase();
        }

        public Edge(string label)
        {
            Label = label;
        }

        public override string ToString()
        {
            return $"({OutV}) --[{Label}({Id})]-> ({InV})";
        }
    }
}
