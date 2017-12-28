using System;
using Microsoft.Azure.Documents.SystemFunctions;
using Newtonsoft.Json;
using Xania.Graphs;
using Xania.Reflection;

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
                var v = prop.Value;
                {
                    writer.WriteStartObject();
                    writer.WritePropertyName("_value");
                    if (v == null)
                        writer.WriteNull();
                    else if (v.GetType().IsPrimitive())
                        writer.WriteValue(v);
                    else 
                        serializer.Serialize(writer, v);
                    writer.WritePropertyName("id");
                    writer.WriteValue(Guid.NewGuid());
                    writer.WriteEndObject();
                }
                writer.WriteEndArray();
            }
            writer.WriteEndObject();
        }
    }
}