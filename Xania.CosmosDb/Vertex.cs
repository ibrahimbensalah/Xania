using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Xania.CosmosDb
{
    [JsonConverter(typeof(VertexConverter))]
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
}