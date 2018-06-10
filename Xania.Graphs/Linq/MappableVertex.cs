using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Xania.Graphs.Structure;
using Xania.ObjectMapper;
using Xania.Reflection;

namespace Xania.Graphs.Linq
{
    internal class MappableVertex : IMappable
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
            yield return new KeyValuePair<string, object>("Id", _vertex.Id);

            foreach (var p in _vertex.Properties)
                yield return new KeyValuePair<string, object>(p.Name, ToClType(p.Value));

            var relations = _graph.Edges.Where(edge => edge.OutV == _vertex.Id).ToArray();
            foreach (var g in relations.GroupBy(r => r.Label))
                yield return new KeyValuePair<string, object>(g.Key, new MappableRelation(g.Select(e => e.InV).ToArray()));

            //{
            //    if (t.IsEnumerable())
            //    {
            //        var itemType = t.GetItemType();
            //        return new[] { Proxy(itemType, edge.InV) };
            //    }

            //    return Proxy(t, edge.InV);
            //}));
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
    }

    internal class MappableRelation : IMappable
    {
        private readonly string[] _vertices;

        public MappableRelation(string[] vertices)
        {
            _vertices = vertices;
        }

        public IOption<IMapping> To(Type targetType)
        {
            var enumerableType = typeof(IEnumerable<>).MapFrom(targetType);

            var proxies = _vertices.Select(v => new Dictionary<string, object> {{"Id", v}});
            if (enumerableType != null)
            {
                var elementType = enumerableType.GenericTypeArguments[0];
                return new EnumerableMapping(proxies, elementType).Some();
            }

            return
                proxies
                    .Select(proxy => new ObjectMapping(proxy, targetType))
                    .SingleOrNone()
                ;
        }

        public object Proxy(Type modelType, string vertexId)
        {
            var relModelProperties = TypeDescriptor.GetProperties(modelType)
                .OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;

            var id = relIdProperty == null ? null : vertexId.Convert(relIdProperty.PropertyType);

            return new ShallowProxy(modelType, id).GetTransparentProxy();
        }
    }

    internal class ProxyMapping
    {
        private readonly Type _modelType;
        private readonly string _vertexId;

        public ProxyMapping(Type modelType, string vertexId)
        {
            _modelType = modelType;
            _vertexId = vertexId;
            Dependencies = Enumerable.Empty<IDependency>();
        }

        public IEnumerable<IDependency> Dependencies { get; }

        public IOption<object> Create(IMap<string, object> values)
        {
            var relModelProperties = TypeDescriptor.GetProperties(_modelType)
                .OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;

            var id = relIdProperty == null ? null : _vertexId.Convert(relIdProperty.PropertyType);

            return new ShallowProxy(_modelType, id).GetTransparentProxy().Some();
        }
    }
}