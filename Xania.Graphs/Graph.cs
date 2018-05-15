using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Xania.Graphs.Linq;
using Xania.Graphs.Structure;
using Xania.Reflection;

namespace Xania.Graphs
{
    public class Graph
    {
        public IDbSet<Vertex> Vertices { get; } = new InMemoryDbSet<Vertex>();
        public IDbSet<Edge> Edges { get; } = new InMemoryDbSet<Edge>();

        public static Graph FromObject(params Object[] models)
        {
            var cache = new Dictionary<object, Vertex>();
            var subGraphs = models.Select(model => ((GraphValue, ICollection<(Vertex, string, Vertex)>))ConvertValue(model, model.GetType(), cache));

            var graph = new Graph();
            foreach (var sg in subGraphs)
            {
                var vertex = (Vertex)sg.Item1;
                graph.Vertices.Add(vertex);
                foreach (var (from, name, to) in sg.Item2)
                {
                    graph.Vertices.Add(from);
                    graph.Vertices.Add(to);
                    graph.Edges.Add(new Edge(@from.Id, name, to.Id));
                }
            }
            return graph;
        }

        private static (GraphValue, IEnumerable<(Vertex, string, Vertex)>) ConvertValue(object obj, Type valueType, IDictionary<object, Vertex> cache)
        {
            if (obj == null)
                throw new ArgumentNullException();

            var empty = Enumerable.Empty<(Vertex, string, Vertex)>();
            if (cache.TryGetValue(obj, out var result))
                return (result, empty);
            if (valueType == typeof(string))
                return (new GraphPrimitive(typeof(string), obj), empty);
            if (valueType == typeof(int))
                return (new GraphPrimitive(typeof(int), obj), empty);
            if (valueType == typeof(float))
                return (new GraphPrimitive(typeof(float), obj), empty);
            if (valueType == typeof(double))
                return (new GraphPrimitive(typeof(double), obj), empty);
            if (valueType == typeof(decimal))
                return (new GraphPrimitive(typeof(decimal), obj), empty);
            if( valueType == typeof(DateTime))
                return (new GraphPrimitive(typeof(DateTime), obj), empty);
            if( valueType == typeof(DateTimeOffset))
                return (new GraphPrimitive(typeof(DateTimeOffset), obj), empty);
            if (valueType.IsEnumerable())
            {
                var elementType = valueType.GetItemType();
                if (elementType == null)
                    throw new InvalidOperationException($"Could not derive element type from '{valueType}'");

                var items = ((IEnumerable) obj).OfType<object>().Select(e => ConvertValue(e, elementType, cache)).ToArray();
                return (new GraphList(items.Select(e => e.Item1).ToArray()), items.SelectMany(e => e.Item2));
            }

            if (valueType.IsComplexType())
                return (ConvertComplex(obj, cache), empty);

            var vertex = new Vertex(valueType.Name.ToCamelCase());
            var outE = new List<(Vertex, string, Vertex)>();

            cache.Add(obj, vertex);
            foreach (var prop in TypeDescriptor.GetProperties(obj).OfType<PropertyDescriptor>())
            {
                var propValue = prop.GetValue(obj);
                if (string.Equals(prop.Name, "id", StringComparison.InvariantCultureIgnoreCase))
                    vertex.Id = propValue?.ToString() ?? Guid.NewGuid().ToString();
                else if (propValue != null)
                {
                    var (v, pE) = ConvertValue(propValue, propValue.GetType(), cache);
                    outE.AddRange(pE);

                    if (IsVertexType(prop.PropertyType))
                        outE.AddRange(Unfold(v).Select(e => (vertex, prop.Name, e)));
                    else
                        vertex.Properties.Add(new Property(prop.Name, v));
                }
            }
            return (vertex, outE);
        }

        private static IEnumerable<Vertex> Unfold(object obj)
        {
            if (obj is GraphList list)
                return list.Items.OfType<Vertex>();
            if (obj is Vertex v)
                return v.AsEnumerable();
            
            throw new InvalidOperationException();
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

        private static GraphObject ConvertComplex(object rootObj, IDictionary<object, Vertex> cache)
        {
            var root = new GraphObject();

            var stack = new Stack<(GraphObject, object)>();
            stack.Push((root, rootObj));
            while (stack.Count > 0)
            {
                var (container, obj) = stack.Pop();
                foreach (var prop in TypeDescriptor.GetProperties(obj).OfType<PropertyDescriptor>())
                {
                    var propValue = prop.GetValue(rootObj);
                    if (propValue == null)
                        continue;

                    var(c, E) = ConvertValue(propValue, prop.PropertyType, cache);
                    if (E.Any())
                        throw new InvalidOperationException();
                    container.Properties.Add(new Property(prop.Name.ToCamelCase(), c));
                }
            }

            return root;
        }

        //public IEnumerable<TModel> ToObjects<TModel>() where TModel : new()
        //{
        //    return ToObjects(typeof(TModel)).OfType<TModel>();
        //}

        //public IEnumerable ToObjects(Type modelType)
        //{
        //    var cache = new Dictionary<Vertex, object>();
        //    var label = modelType.IsAnonymousType() ? null : modelType.Name.ToCamelCase();
        //    foreach (var vertex in Vertices.Where(e => string.Equals(e.Label, label)))
        //        yield return ToObject(vertex, modelType, cache);
        //}

        //public Object ToObject(Vertex vertex, Type modelType, IDictionary<Vertex, object> cache)
        //{
        //    if (cache.TryGetValue(vertex, out var model))
        //        return model;
        //    cache.Add(vertex, model = modelType.CreateInstance(new Dictionary<string,object>()));

        //    var modelProperties = TypeDescriptor.GetProperties(modelType).OfType<PropertyDescriptor>()
        //        .ToDictionary(e => e.Name, StringComparer.InvariantCultureIgnoreCase);
        //    var idProperty = modelProperties.ContainsKey("Id") ? modelProperties["Id"] : null;
        //    idProperty?.SetValue(model, vertex.Id.ConvertMany(idProperty.PropertyType));

        //    foreach (var p in vertex.Properties)
        //    {
        //        // var values = p.Values.Select(e => e.Item2);
        //        if (!modelProperties.ContainsKey(p.Name))
        //            continue;

        //        var modelProperty = modelProperties[p.Name];
        //        modelProperty.SetValue(model, Convert2(p.Value, modelProperty.PropertyType));
        //    }

        //    foreach (var rel in Edges.Where(e => string.Equals(e.OutV, vertex.Id)))
        //    {
        //        var target = Vertices.SingleOrDefault(e => e.Id.Equals(rel.InV));
        //        var modelProperty = modelProperties[rel.Label];
        //        if (typeof(IEnumerable).IsAssignableFrom(modelProperty.PropertyType))
        //        {
        //            var elementType = modelProperty.PropertyType.GetItemType();
        //            if (target != null)
        //                Add(modelProperty.GetValue(model), ToObject(target, elementType, cache), elementType);
        //        }
        //        else
        //        {
        //            if (target != null)
        //                modelProperty.SetValue(model, ToObject(target, modelProperty.PropertyType, cache));
        //        }
        //    }
        //    return model;
        //}

        private object Convert2(GraphValue value, Type type)
        {
            throw new NotImplementedException();
        }

        private void Add(object collection, object toObject, Type elementType)
        {
            var collectionType = TypeDescriptor.GetReflectionType(collection);
            var addMethod = collectionType.GetMethod("Add", new[] { elementType });
            if (addMethod == null)
                throw new Exception("Add method is not found");
            addMethod.Invoke(collection, new[] { toObject });
        }

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
        }
    }

    public interface IDbSet<T>: IQueryable<T>
    {
        void Add(T item);
    }

    public class InMemoryDbSet<T> : EnumerableQuery<T>, IDbSet<T>
    {
        private readonly HashSet<T> _inner;

        public InMemoryDbSet()
            : this(new HashSet<T>())
        {
        }

        private InMemoryDbSet(HashSet<T> hashSet) : base(hashSet)
        {
            _inner = hashSet;
        }

        public void Add(T item)
        {
            _inner.Add(item);
        }
    }
}