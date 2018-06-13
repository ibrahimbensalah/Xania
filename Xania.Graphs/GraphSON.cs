using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Xania.Graphs.Elements;
using Xania.Reflection;

namespace Xania.Graphs
{
    public class GraphSON : IEnumerable<KeyValuePair<string, object>>
    {
        public string Id { get; set; }
        public Dictionary<string, object> Properties { get; set; }
        public IEnumerable<Edge> Relations { get; set; }

        public bool TryGetValue(string name, out object value)
        {
            if (name.Equals("id", StringComparison.InvariantCultureIgnoreCase))
            {
                value = Id;
                return true;
            }

            if (Properties.TryGetValue(name, out value))
                return true;


            return false;
        }

        public IEnumerator<KeyValuePair<string, object>> GetEnumerator()
        {
            yield return new KeyValuePair<string, object>("id", Id);

            foreach (var p in Properties)
                yield return new KeyValuePair<string, object>(p.Key, p.Value);

            foreach (var edge in Relations)
                yield return new KeyValuePair<string, object>(edge.Label, new Func<Type, object>(t =>
                {
                    if (t.IsEnumerable())
                    {
                        var itemType = t.GetItemType();
                        return new[] {Proxy(itemType, edge.InV)};
                    }

                    return Proxy(t, edge.InV);
                }));
        }

        private static object Proxy(Type modelType, object targetId)
        {
            var relModelProperties = TypeDescriptor.GetProperties(modelType)
                .OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;

            var id = relIdProperty == null ? null : targetId.Convert(relIdProperty.PropertyType);

            return new ShallowProxy(modelType, id).GetTransparentProxy();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}