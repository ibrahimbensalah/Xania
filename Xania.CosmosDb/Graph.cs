using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Xania.CosmosDb
{
    public class Graph
    {
        public Collection<Vertex> Vertices { get; } = new Collection<Vertex>();
        public Collection<Relation> Relations { get; } = new Collection<Relation>();

        public static Graph FromObject(Object model)
        {
            return ConvertObject(model).Item2;
        }

        private static Tuple<Vertex, Graph> ConvertObject(object value)
        {
            if (value == null)
                return new Tuple<Vertex, Graph>(null, null);

            var graph = new Graph();
            var vertex = new Vertex(value.GetType().Name);
            foreach (var prop in TypeDescriptor.GetProperties(value).OfType<PropertyDescriptor>())
            {
                var propValue = prop.GetValue(value);
                if (IsPrimitive(prop.PropertyType))
                {
                    if (string.Equals(prop.Name, "id", StringComparison.InvariantCultureIgnoreCase))
                        vertex.Id = propValue?.ToString() ?? Guid.NewGuid().ToString();
                    else if (propValue != null)
                        vertex.Properties.Add(new Property(prop.Name, new Tuple<string, object>(Guid.NewGuid().ToString(), propValue)));
                }
                else if (propValue is IRelation)
                {
                    var rel = propValue as IRelation;

                    Merge(graph, vertex, prop.Name, rel);
                }
                else if (propValue is IEnumerable)
                {
                    var enumerable = propValue as IEnumerable;
                    var elementType = GetElementType(propValue.GetType());
                    if (elementType == null)
                        throw new InvalidOperationException($"Could not derive element type from '{propValue.GetType()}'");

                    Merge(vertex, prop, graph, elementType, enumerable);
                }
                else if (propValue != null)
                {
                    // throw new NotImplementedException();
                }

            }
            graph.Vertices.Add(vertex);
            return new Tuple<Vertex, Graph>(vertex, graph);
        }

        private static void Merge(Graph graph, Vertex vertex, string propName, IRelation rel)
        {
            var pair = ConvertObject(rel.Target);
            graph.Relations.Add(new Relation(vertex.Id, propName, pair.Item1.Id) { Id = rel.Id });
            foreach (var x in pair.Item2.Relations)
                graph.Relations.Add(x);
            foreach (var childVertex in pair.Item2.Vertices)
                graph.Vertices.Add(childVertex);
        }

        private static void Merge(Vertex vertex, PropertyDescriptor prop, Graph graph, Type elementType, IEnumerable enumerable)
        {
            if (IsPrimitive(elementType))
            {
                var values = enumerable.OfType<object>()
                    .Select(e => new Tuple<string, object>(Guid.NewGuid().ToString(), e));
                vertex.Properties.Add(new Property(prop.Name, values.ToArray()));
            }
            else
            {
                foreach (var e in enumerable)
                {
                    var pair = ConvertObject(e);
                    Merge(graph, vertex, prop.Name, pair);
                }
            }
        }

        private static void Merge(Graph graph, Vertex vertex, string propName, Tuple<Vertex, Graph> pair)
        {
            graph.Relations.Add(new Relation(vertex.Id, propName, pair.Item1.Id));
            foreach (var rel in pair.Item2.Relations)
                graph.Relations.Add(rel);
            foreach (var childVertex in pair.Item2.Vertices)
                graph.Vertices.Add(childVertex);
        }

        private static Type GetElementType(Type enumerableType)
        {
            foreach (var i in enumerableType.GetInterfaces())
            {
                if (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>))
                    return i.GenericTypeArguments[0];
            }
            return null;
        }


        private static bool IsPrimitive(Type type)
        {
            return type.IsPrimitive || type == typeof(string);
        }

        public IEnumerable<TModel> ToObjects<TModel>() where TModel : new()
        {
            var cache = new Dictionary<Vertex, object>();

            var label = typeof(TModel).Name;
            foreach (var vertex in Vertices.Where(e => e.Label.Equals(label, StringComparison.InvariantCultureIgnoreCase)))
            {
                yield return (TModel)ToObject(vertex, typeof(TModel), cache);
                // yield return json.ToObject<TModel>();
            }
        }

        private Object ToObject(Vertex vertex, Type modelType, IDictionary<Vertex, object> cache)
        {
            if (cache.TryGetValue(vertex, out var model))
                return model;
            cache.Add(vertex, model = Activator.CreateInstance(modelType));

            var modelProperties = TypeDescriptor.GetProperties(model).OfType<PropertyDescriptor>()
                .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
            var idProperty = modelProperties.ContainsKey("Id") ? modelProperties["Id"] : null;
            idProperty?.SetValue(model, Convert(vertex.Id, idProperty.PropertyType));

            foreach (var p in vertex.Properties)
            {
                var values = p.Values.Select(e => e.Item2);
                if (!modelProperties.ContainsKey(p.Name))
                    continue;

                var modelProperty = modelProperties[p.Name];
                var value = typeof(string) != modelProperty.PropertyType &&
                            typeof(IEnumerable).IsAssignableFrom(modelProperty.PropertyType)
                    ? values.ToArray()
                    : values.SingleOrDefault();
                modelProperty.SetValue(model, Convert(value, modelProperty.PropertyType));
            }

            foreach (var rel in Relations.Where(e => e.SourceId.Equals(vertex.Id)))
            {
                var target = Vertices.SingleOrDefault(e => e.Id.Equals(rel.TargetId));
                var modelProperty = modelProperties[rel.Name];
                if (target == null)
                {
                    var relModelProperties = TypeDescriptor.GetProperties(modelProperty.PropertyType).OfType<PropertyDescriptor>()
                        .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
                    var relIdProperty = relModelProperties.ContainsKey("Id") ? relModelProperties["Id"] : null;
                    modelProperty.SetValue(model, Proxy(modelProperty.PropertyType, Convert(rel.TargetId, relIdProperty?.PropertyType)));
                }
                else if (typeof(IEnumerable).IsAssignableFrom(modelProperty.PropertyType)) 
                {
                    var elementType = GetElementType(modelProperty.PropertyType);
                    Add(modelProperty.GetValue(model), ToObject(target, elementType, cache));
                }
                else 
                {
                    modelProperty.SetValue(model, ToObject(target, modelProperty.PropertyType, cache));
                }
            }
            return model;
        }

        private object Proxy(Type proxyType, object id)
        {
            return new ShallowProxy(proxyType, id).GetTransparentProxy();
        }

        private void Add(object collection, object toObject)
        {
            var collectionType = TypeDescriptor.GetReflectionType(collection);
            var addMethod = collectionType.GetMethod("Add", new Type[] { toObject.GetType() });
            if (addMethod == null)
                throw new Exception("Add method is not found");
            addMethod.Invoke(collection, new[] { toObject });
        }

        private static object Convert(object source, Type targetType)
        {
            if (targetType == null)
                return null;
            return JToken.FromObject(source).ToObject(targetType);
        }

        /// <summary>
        /// TODO 
        /// </summary>
        /// <param name="vertex"></param>
        /// <returns></returns>
        public JObject ToJson(Vertex vertex)
        {
            if (vertex == null)
                return null;

            var o = new JObject { { "Id", vertex.Id } };
            foreach (var p in vertex.Properties)
            {
                var value = p.Values.Select(e => e.Item2).ToArray();
                o.Add(p.Name, JToken.FromObject(value));
            }
            foreach (var rel in Relations.Where(e => e.SourceId.Equals(vertex.Id)))
            {
                var target = ToJson(Vertices.SingleOrDefault(e => e.Id.Equals(rel.TargetId)));
                o.Add(rel.Name, target);
            }
            return o;
        }
    }

    public class TypeResolver: ITypeResolver
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