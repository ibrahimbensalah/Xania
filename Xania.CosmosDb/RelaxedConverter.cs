using System;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class RelaxedConverter : JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            var elementType = objectType.GetItemType();

            if (token.Type == JTokenType.Null)
                return existingValue;

            object[] items;
            if (token.Type == JTokenType.Array)
            {
                var arr = (JArray)token;
                items = arr.Select(e => e.ToObject(elementType, serializer)).ToArray();
            }
            else
                items = new[] { token.ToObject(elementType, serializer) };

            if (objectType.IsArray)
                return objectType.CreateArray(items);

            existingValue = existingValue ?? objectType.CreateCollection();
            return existingValue.AddRange(items);
        }

        public override bool CanConvert(Type objectType)
        {
            return objectType.IsEnumerable();
        }
    }
}