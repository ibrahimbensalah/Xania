using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using Xania.Reflection;

namespace Xania.CosmosDb
{
    public class GraphConverter : JsonConverter
    {
        private bool skipOnce = false;

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            if (token.Type == JTokenType.Null)
                return existingValue;

            if (objectType.IsEnumerable() && token.Type != JTokenType.Array)
            {
                object[] items = {token.ToObject(objectType.GetItemType(), serializer)};

                if (objectType.IsArray)
                    return objectType.CreateArray(items);

                return existingValue ?? objectType.CreateCollection(items);
            }

            //if (token.Type == JTokenType.Object)
            //{
            //    var obj = (JObject)token;

            //    var valueFactories = obj.Properties().ToDictionary<JProperty, string, Func<Type, object>>(e => e.Name, e => t => e.Value.ToObject(t, serializer));

            //    if (existingValue == null)
            //        return objectType.CreateInstance(valueFactories);


            //    //foreach (var prop in objectType.GetProperties())
            //    //{
            //    //    object value;
            //    //    if (valueFactories.TryGetValue(prop.Name))
            //    //}
            //}

            skipOnce = true;
            return token.ToObject(objectType, serializer);
        }

        public override bool CanConvert(Type objectType)
        {
            var b = !skipOnce;
            skipOnce = false;
            return b;
        }

        internal static IEnumerable<JsonConverter> GetConverters(JsonSerializer serializer, Type objectType)
        {
            var contractResolver = serializer.ContractResolver.ResolveContract(objectType);

            if (contractResolver.Converter != null)
                yield return contractResolver.Converter;

            foreach (JsonConverter converter in serializer.Converters.Where(e => e.CanRead))
            {
                if (converter.CanConvert(objectType))
                {
                    yield return converter;
                }
            }
        }

    }
}