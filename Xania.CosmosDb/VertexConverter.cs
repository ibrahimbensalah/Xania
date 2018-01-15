using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Xania.Graphs.Structure;

namespace Xania.CosmosDb
{
    internal class VertexConverter : JsonConverter
    {
        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(Vertex);
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var vertex = (Vertex)value;
            writer.WriteStartObject();
            writer.WritePropertyName("label");
            writer.WriteValue(vertex.Label);
            writer.WritePropertyName("id");
            writer.WriteValue(vertex.Id);
            foreach (var prop in vertex.Properties)
            {
                writer.WritePropertyName(prop.Name);
                writer.WriteStartArray();
                throw new NotImplementedException();
                //foreach (var v in ToObject(prop.Value))
                //{
                //    writer.WriteStartObject();
                //    writer.WritePropertyName("_value");
                //    if (v is IDictionary<string, object> dict)
                //    {
                //        writer.WriteStartObject();
                //        foreach (var kvp in dict)
                //        {
                //            writer.WritePropertyName(kvp.Key);
                //            serializer.Serialize(writer, kvp.Value);
                //        }
                //        writer.WriteEndObject();
                //    }
                //    else
                //        writer.WriteValue(v);
                //    writer.WritePropertyName("id");
                //    writer.WriteValue(Guid.NewGuid());
                //    writer.WriteEndObject();
                //}
                writer.WriteEndArray();
            }
            writer.WriteEndObject();
        }

        private IEnumerable<object> ToObject(GraphValue value)
        {
            if (value is GraphList l)
                return l.Items.Select(e => e.ToClType());
            return new[] { value.ToClType() };
        }
    }
}