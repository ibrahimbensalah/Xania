using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using Xania.Reflection;

namespace Xania.Graphs
{
    public class Graph
    {
        public HashSet<Vertex> Vertices { get; } = new HashSet<Vertex>();
        public HashSet<Edge> Edges { get; } = new HashSet<Edge>();

        public static Graph FromObject(params Object[] models)
        {
            var cache = new Dictionary<object, object>();
            var subgraphs = models.Select(model => (SubGraph)ConvertValue(model, model.GetType(), cache));

            var graph = new Graph();
            foreach (var sg in subgraphs)
            {
                graph.Vertices.Add(sg.Pivot);
                foreach (var (from, name, to) in sg.Out)
                {
                    graph.Vertices.Add(from);
                    graph.Vertices.Add(to);
                    graph.Edges.Add(new Edge(@from.Id, name, to.Id));
                }
            }
            return graph;
        }

        private static object ConvertValue(object value, Type valueType, IDictionary<object, object> cache)
        {
            if (cache.TryGetValue(value, out var result))
                return result;

            if (valueType.IsPrimitive())
                return value;
            if (valueType.IsComplexType())
                return ConvertComplex(value, valueType);

            // return ConvertResult.Complex(value);
            if (value is IEnumerable enumerable)
            {
                var elementType = valueType.GetItemType();
                if (elementType == null)
                    throw new InvalidOperationException($"Could not derive element type from '{valueType}'");

                return enumerable.OfType<object>().Select(e => ConvertValue(e, elementType, cache));
            }

            var vertex = new Vertex(valueType.Name.ToCamelCase());
            var subGraph = new SubGraph(vertex);
            cache.Add(value, new SubGraph(vertex));
            foreach (var prop in TypeDescriptor.GetProperties(value).OfType<PropertyDescriptor>())
            {
                var propValue = prop.GetValue(value);
                if (string.Equals(prop.Name, "id", StringComparison.InvariantCultureIgnoreCase))
                    subGraph.Pivot.Id = propValue?.ToString() ?? Guid.NewGuid().ToString();
                else if (propValue != null)
                {
                    var convertResult = ConvertValue(propValue, propValue.GetType(), cache);
                    if (IsVertexType(prop.PropertyType))
                    {
                        foreach (var sg in Unfold(convertResult).Cast<SubGraph>())
                        {
                            foreach (var rel in sg.Out)
                                subGraph.Out.Add(rel);
                            subGraph.Out.Add((subGraph.Pivot, prop.Name, sg.Pivot));
                        }
                    }
                    else
                        subGraph.Pivot.Properties.Add(new Property(prop.Name, convertResult));
                }
            }
            return subGraph;
        }

        private static IEnumerable<object> Unfold(object obj)
        {
            if (obj is IEnumerable enu)
            {
                foreach (var o in enu)
                    yield return o;
            }
            else
                yield return obj;
        }

        private static bool IsVertexType(Type type)
        {
            if (type.IsEnumerable())
            {
                var itemType = type.GetItemType();
                return !itemType.IsPrimitive() && !itemType.IsComplexType();
            }
            else
                return !type.IsPrimitive() && !type.IsComplexType();
        }

        private static object ConvertComplex(object value, Type valueType)
        {
            if (value == null)
                return null;
            if (valueType.IsPrimitive())
                return value;
            if (valueType.IsEnumerable())
                return ((IEnumerable) value).OfType<object>().Select(e => ConvertComplex(e, e.GetType()));

            var stack = new Stack<(Dictionary<string, object>, object)>();
            var root = new Dictionary<string, object>();
            stack.Push((root, value));

            while (stack.Count > 0)
            {
                var (container, obj) = stack.Pop();
                foreach (var prop in TypeDescriptor.GetProperties(obj).OfType<PropertyDescriptor>())
                {
                    var propValue = prop.GetValue(value);
                    if (propValue == null)
                        continue;

                    container.Add(prop.Name.ToCamelCase(), ConvertComplex(propValue, prop.PropertyType));
                }
            }

            return root;
        }

        public IEnumerable<TModel> ToObjects<TModel>() where TModel : new()
        {
            return ToObjects(typeof(TModel)).OfType<TModel>();
        }

        public IEnumerable ToObjects(Type modelType)
        {
            var cache = new Dictionary<Vertex, object>();

            //if (modelType.IsAnonymousType())
            //{
            //    foreach (var v in Anonymous)
            //        yield return ToObject(v, modelType, cache);
            //}
            //else

            var label = modelType.IsAnonymousType() ? null : modelType.Name.ToCamelCase();
            foreach (var vertex in Vertices.Where(e => string.Equals(e.Label, label)))
                yield return ToObject(vertex, modelType, cache);
        }

        //private object ToObject(JToken token, Type modelType, IDictionary<Vertex, object> cache)
        //{
        //    return token.ToObject(modelType);
        //}

        public Object ToObject(Vertex vertex, Type modelType, IDictionary<Vertex, object> cache)
        {
            if (cache.TryGetValue(vertex, out var model))
                return model;
            cache.Add(vertex, model = Activator.CreateInstance(modelType));

            var modelProperties = TypeDescriptor.GetProperties(model).OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var idProperty = modelProperties.ContainsKey("Id") ? modelProperties["Id"] : null;
            idProperty?.SetValue(model, vertex.Id.Convert(idProperty.PropertyType));

            foreach (var p in vertex.Properties)
            {
                // var values = p.Values.Select(e => e.Item2);
                if (!modelProperties.ContainsKey(p.Name))
                    continue;

                var modelProperty = modelProperties[p.Name];
                modelProperty.SetValue(model, p.Value.Convert(modelProperty.PropertyType));
            }

            foreach (var rel in Edges.Where(e => string.Equals(e.OutV, vertex.Id)))
            {
                var target = Vertices.SingleOrDefault(e => e.Id.Equals(rel.InV));
                var modelProperty = modelProperties[rel.Label];
                if (typeof(IEnumerable).IsAssignableFrom(modelProperty.PropertyType))
                {
                    var elementType = modelProperty.PropertyType.GetItemType();
                    if (target != null)
                        Add(modelProperty.GetValue(model), ToObject(target, elementType, cache), elementType);
                    //var item = target == null
                    //    ? Proxy(elementType, rel.TargetId)
                    //    : ToObject(target, elementType, cache);
                    //Add(modelProperty.GetValue(model), item, elementType);
                }
                else
                {
                    if (target != null)
                        modelProperty.SetValue(model, ToObject(target, modelProperty.PropertyType, cache));
                    //    Add(modelProperty.GetValue(model), ToObject(target, modelProperty.PropertyType, cache), elementType);
                    //var item = target == null
                    //    ? Proxy(modelProperty.PropertyType, rel.TargetId)
                    //    : ToObject(target, modelProperty.PropertyType, cache);
                    //modelProperty.SetValue(model, item);
                }
            }
            return model;
        }

        //private object Proxy(Type modelType, string targetId)
        //{
        //    var relModelProperties = TypeDescriptor.GetProperties(modelType)
        //        .OfType<PropertyDescriptor>()
        //        .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
        //    var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;
        //    return Proxy(modelType, Convert(targetId, relIdProperty?.PropertyType));
        //}

        //private object Proxy(Type proxyType, object id)
        //{
        //    if (typeof(MarshalByRefObject).IsAssignableFrom(proxyType) || proxyType.IsInterface)
        //        return new ShallowProxy(proxyType, id).GetTransparentProxy();
        //    return null;
        //}

        private void Add(object collection, object toObject, Type elementType)
        {
            var collectionType = TypeDescriptor.GetReflectionType(collection);
            var addMethod = collectionType.GetMethod("Add", new[] { elementType });
            if (addMethod == null)
                throw new Exception("Add method is not found");
            addMethod.Invoke(collection, new[] { toObject });
        }

        ///// <summary>
        ///// TODO 
        ///// </summary>
        ///// <param name="vertex"></param>
        ///// <returns></returns>
        //public JObject ToJson(Vertex vertex)
        //{
        //    if (vertex == null)
        //        return null;

        //    var o = new JObject {{"Id", vertex.Id}};
        //    foreach (var p in vertex.Properties)
        //    {
        //        var value = p.Values.Select(e => e.Item2).ToArray();
        //        o.Add(p.Name, JToken.FromObject(value));
        //    }
        //    foreach (var rel in Relations.Where(e => e.SourceId.Equals(vertex.Id)))
        //    {
        //        var target = ToJson(Vertices.SingleOrDefault(e => e.Id.Equals(rel.TargetId)));
        //        o.Add(rel.Name, target);
        //    }
        //    return o;
        //}
        public void Merge(Graph other)
        {
            if (other == null)
                return;
            foreach (var edge in other.Edges)
                Edges.Add(edge);
            foreach(var vertex in other.Vertices) 
                Vertices.Add(vertex);
        }

        public IEnumerable<Vertex> Out(Vertex from, string edgeLabel)
        {
            var edges = Edges.Where(edge =>
                    edge.Label.Equals(edgeLabel, StringComparison.InvariantCultureIgnoreCase) &&
                    edge.OutV.Equals(from.Id, StringComparison.InvariantCultureIgnoreCase)).ToArray();
            return edges.Select(e => Vertices.Single(to => to.Id.Equals(e.InV))).ToArray();

            //return Edges.Where(edge =>
            //        edge.Label.Equals(edgeLabel, StringComparison.InvariantCultureIgnoreCase) &&
            //        edge.OutV.Equals(from.Id, StringComparison.InvariantCultureIgnoreCase))
            //    .Select(edge => Vertices.Single(to => to.Id.Equals(edge.InV)));
        }
    }

    internal class SubGraph
    {
        public Vertex Pivot { get; }
        public ICollection<(Vertex, string, Vertex)> Out { get; } = new List<(Vertex, string, Vertex)>();

        public SubGraph(Vertex pivot)
        {
            Pivot = pivot;
        }
    }

    internal class PrimitiveResult : ConvertResult
    {
        public override Object Execute()
        {
            return Value;
        }

        public object Value { get; set; }
    }

    internal class ObjectResult : ConvertResult
    {
        public Vertex Vertex { get; set; }

        public override object Execute()
        {
            return Vertex;
        }
    }

    internal abstract class ConvertResult
    {
        public static ConvertResult None { get; set; } = new NoResult();

        public static ObjectResult Object(Vertex vertex)
        {
            return new ObjectResult
            {
                Vertex = vertex
            };
        }

        public abstract object Execute();

        public static PrimitiveResult Primitve(object value)
        {
            return new PrimitiveResult
            {
                Value = value
            };
        }

        public static ListResult List(IEnumerable<ConvertResult> list)
        {
            return new ListResult
            {
                Values = list
            };
        }

        public static ComplexResult Complex(object value)
        {
            return new ComplexResult
            {
                Value = value
            };
        }
    }

    internal class ComplexResult : ConvertResult
    {
        public override object Execute()
        {
            return null;
        }

        private void Merge2(Graph graph, Vertex vertex, string baseName)
        {
            var stack = new Stack<(IEnumerable<string>, object)>();
            stack.Push((Enumerable.Empty<string>(), Value));

            var values = new Collection<Tuple<string, object>>();
            while (stack.Count > 0)
            {
                var (p, v) = stack.Pop();

                foreach (var prop in TypeDescriptor.GetProperties(v).OfType<PropertyDescriptor>())
                {
                    var propValue = prop.GetValue(v);
                    var propName = prop.Name.ToCamelCase();
                    var propPath = p.Append(propName);
                    if (prop.PropertyType.IsPrimitive())
                        values.Add(new Tuple<string, object>(
                            propPath.Join("."),
                            propValue
                        ));
                    else if (propValue is IEnumerable enumerable)
                    {
                        var i = 0;
                        foreach(var e in enumerable)
                            stack.Push((p.Append($"{propName}[{i++}]"), e));
                    }
                    else
                        stack.Push((p.Append(propName), propValue));
                }
            }
            vertex.Properties.Add(new Property(baseName, values.ToArray()));
        }

        public object Value { get; set; }
    }

    internal class ListResult : ConvertResult
    {
        public IEnumerable<ConvertResult> Values { get; set; }

        public override object Execute()
        {
            return Values.Select(i => i.Execute());
        }
    }

    internal class NoResult : ConvertResult
    {
        public override object Execute()
        {
            return null;
        }
    }

    public class TypeResolver : ITypeResolver
    {
        private readonly Type _modelType;

        public TypeResolver(Type modelType)
        {
            _modelType = modelType;
        }

        public object Resolve(string vertexLabel)
        {
            throw new NotImplementedException();
        }
    }

    internal interface ITypeResolver
    {
        object Resolve(string vertexLabel);
    }
}