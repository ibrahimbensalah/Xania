using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Xania.Graphs.Structure;
using Xania.ObjectMapper;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
    internal class VertexMappingResolver : IMappingResolver
    {
        private readonly Graph _graph;

        public VertexMappingResolver(Graph graph)
        {
            _graph = graph;
        }

        public IOption<IMappable> Resolve(object obj)
        {
            return obj is Vertex vertex
                ? (IOption<IMappable>) new MappableVertex(_graph, vertex).Some()
                : Option<IMappable>.None();
        }
    }

    internal class MappableVertex: IMappable
    {
        private readonly Graph _graph;
        private readonly Vertex _vertex;

        public MappableVertex(Graph graph, Vertex vertex)
        {
            _graph = graph;
            _vertex = vertex;
        }

        public IOption<IMapping> To(Type targetType)
        {
            return new ObjectMapping(GetValues(), targetType).Some();
        }

        private IEnumerable<KeyValuePair<string, object>> GetValues()
        {
            yield return new KeyValuePair<string, object>("id", _vertex.Id);

            foreach (var p in _vertex.Properties)
                yield return new KeyValuePair<string, object>(p.Name, ToClType(p.Value));

            var relations = _graph.Edges.Where(edge => edge.OutV == _vertex.Id);
            foreach (var edge in relations)
                yield return new KeyValuePair<string, object>(edge.Label, new Func<Type, object>(t =>
                {
                    if (t.IsEnumerable())
                    {
                        var itemType = t.GetItemType();
                        return new[] { Proxy(itemType, edge.InV) };
                    }

                    return Proxy(t, edge.InV);
                }));
        }

        public static object ToClType(GraphValue result)
        {
            if (result is GraphList list)
            {
                return list.Items.Select(ToClType);
            }

            if (result is GraphObject obj)
            {
                var dict = new Dictionary<string, object>();

                foreach (var property in obj.Properties)
                    dict.Add(property.Name, ToClType(property.Value));

                return dict;
            }

            if (result is GraphPrimitive prim)
            {
                return prim.Value;
            }

            throw new NotImplementedException($"ToClType {result.GetType()}");
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

    }
}