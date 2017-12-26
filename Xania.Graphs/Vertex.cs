using System;
using System.Collections.Generic;

namespace Xania.Graphs
{
    public class Vertex
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Label { get; set; }

        public HashSet<Property> Properties { get; } = new HashSet<Property>();

        public Vertex(string label)
        {
            Label = label.ToCamelCase();
        }
    }

    public class Edge
    {

    }
}