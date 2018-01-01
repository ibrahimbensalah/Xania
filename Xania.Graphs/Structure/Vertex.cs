using System;
using System.Collections.Generic;

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

        public override object ToClType()
        {
            var dict = new Dictionary<string, object>
            {
                {"id", Id},
                {"label", Label}
            };
            ToClType(dict);
            return dict;
        }
    }
}