using System;
using Newtonsoft.Json;

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
                foreach (var v in prop.Values)
                {
                    writer.WriteStartObject();
                    writer.WritePropertyName("_value");
                    writer.WriteValue(v.Item2);
                    writer.WritePropertyName("id");
                    writer.WriteValue(v.Item1);
                    writer.WriteEndObject();
                }
                writer.WriteEndArray();
            }
            writer.WriteEndObject();
        }
    }
}