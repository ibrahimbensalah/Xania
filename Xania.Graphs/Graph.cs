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
        public Collection<Vertex> Vertices { get; } = new Collection<Vertex>();
        public Collection<Edge> Edges { get; } = new Collection<Edge>();

        public static Graph FromObject(Object model)
        {
            return ConvertValue(model, model.GetType(), new Dictionary<object, ConvertResult>()).Graph;
        }

        private static ConvertResult ConvertValue(object value, Type valueType, IDictionary<object, ConvertResult> cache)
        {
            if (cache.TryGetValue(value, out var result))
                return result;

            if (valueType.IsPrimitive())
            {
                return ConvertResult.Primitve(value);
            }
            //if (valueType.IsComplexType())
            //{
            //    return ConvertResult.Complex(value);
            //}
            if (value is IEnumerable enumerable)
            {
                var elementType = valueType.GetItemType();
                if (elementType == null)
                    throw new InvalidOperationException($"Could not derive element type from '{valueType}'");

                if (elementType.IsPrimitive())
                {
                    return ConvertResult.Primitve(enumerable);
                }
                return ConvertResult.List(enumerable.OfType<object>().Select(e => ConvertValue(e, e.GetType(), cache)));
            }

            var vertex = new Vertex(valueType.Name);
            var graph = new Graph();
            foreach (var prop in TypeDescriptor.GetProperties(value).OfType<PropertyDescriptor>())
            {
                var propValue = prop.GetValue(value);
                if (string.Equals(prop.Name, "id", StringComparison.InvariantCultureIgnoreCase))
                    vertex.Id = propValue?.ToString() ?? Guid.NewGuid().ToString();
                else if (propValue != null)
                {
                    var pair = ConvertValue(propValue, propValue.GetType(), cache);
                    pair.Merge(graph, vertex, prop.Name);
                }
            }
            graph.Vertices.Add(vertex);
            return ConvertResult.Object(vertex, graph);
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
    }

    internal class PrimitiveResult : ConvertResult
    {
        public override void Merge(Graph graph, Vertex vertex, string propName)
        {
            vertex.Properties.Add(new Property(propName, Value));
        }

        public object Value { get; set; }
    }

    internal class ObjectResult : ConvertResult
    {
        public Vertex Vertex { get; set; }

        public override void Merge(Graph graph, Vertex vertex, string propName)
        {
            graph.Edges.Add(new Edge(vertex.Id, propName, Vertex.Id));
            foreach (var rel in Graph.Edges)
                graph.Edges.Add(rel);
            foreach (var childVertex in Graph.Vertices)
                graph.Vertices.Add(childVertex);
        }
    }

    internal abstract class ConvertResult
    {
        public Graph Graph { get; set; }
        public static ConvertResult None { get; set; } = new NoResult();

        public static ObjectResult Object(Vertex vertex, Graph graph)
        {
            return new ObjectResult
            {
                Graph = graph,
                Vertex = vertex
            };
        }

        public abstract void Merge(Graph graph, Vertex vertex, string propName);

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
        public override void Merge(Graph graph, Vertex vertex, string baseName)
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

        public override void Merge(Graph graph, Vertex vertex, string propName)
        {
            foreach (var item in Values)
            {
                item.Merge(graph, vertex, propName);
            }
        }
    }

    internal class NoResult : ConvertResult
    {
        public override void Merge(Graph graph, Vertex vertex, string propName)
        {
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