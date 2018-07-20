using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Newtonsoft.Json;
using Xania.Graphs.Elements;

namespace Xania.Graphs.EntityFramework.Tests.Relational
{
    public static class GraphDbContextExtensions
    {
        public static void Store(this GraphDbContext db, Graph graph)
        {
            var properties = new List<Property>();
            var items = new List<Item>();
            var primitives = new List<Primitive>();

            foreach (var vertex in graph.Vertices)
            {
                foreach (var element in GetElements(vertex))
                {
                    if (element.Value is Property prop)
                    {
                        properties.Add(prop);
                        SetLastUpdated(db, prop);
                    }
                    else if (element.Value is Item item)
                    {
                        items.Add(item);
                        SetLastUpdated(db, item);
                    }
                    else if (element.Value is Primitive prim)
                    {
                        primitives.Add(prim);
                        SetLastUpdated(db, prim);
                    }
                }
            }

            db.Merge(properties);
            db.Merge(graph.Vertices.Select(v => new Relational.Vertex {Id = v.Id, Label = v.Label}).ToArray());
            db.Merge(items);
            db.Merge(primitives);

            db.Merge(
                graph.Edges.Select(e=> new Edge
                {
                    Id = e.Id,
                    InV = e.InV,
                    Label = e.Label,
                    OutV = e.OutV
                })
            );
        }

        public static void SetLastUpdated<T>(this GraphDbContext db, T model) where T : class
        {
            db.Entry(model).Property<DateTimeOffset>("LastUpdated").CurrentValue = DateTimeOffset.UtcNow;
        }

        public static int Merge<TEntity>(this DbContext db, IEnumerable<TEntity> entities) where TEntity : class
        {
            return Merge(db, entities.ToArray());
        }

        public static int Merge<TEntity>(this DbContext db, IList<TEntity> entities) where TEntity : class
        {
            var entityType = db.Model.FindEntityType(typeof(TEntity));
            var modelProperties = entityType.GetProperties().ToArray();

            var sb = new StringBuilder();

            var tableName = entityType.GetAnnotations().Where(a => a.Name.Equals("Relational:TableName"))
                .Select(a => a.Value).FirstOrDefault();
            var tableSchema = "dbo";

            sb.AppendLine($"MERGE [{tableSchema}].[{tableName}] tar");
            sb.AppendLine("USING (");
            sb.AppendLine("\tVALUES");
            var param = 0;
            for (var i = 0; i < entities.Count; i++)
            {
                sb.Append($"\t\t(@p{param++}");
                for (var e = 1; e < modelProperties.Length; e++)
                    sb.Append($", @p{param++}");
                sb.AppendLine(i + 1 < entities.Count ? ")," : ")");
            }
            sb.Append($") AS src ([{string.Join("],[", modelProperties.Select(e => e.Name))}]) ON\n\t");
            var primaryProperties = entityType.GetKeys().Where(e => e.IsPrimaryKey()).SelectMany(e => e.Properties);
            var nonPrimaryProperties = entityType.GetProperties().Where(e => !e.IsPrimaryKey()).ToArray();
            sb.AppendJoin("\n\tAND ", primaryProperties.Select(key => $"src.[{key.Name}] = tar.[{key.Name}]"));
            sb.AppendLine();
            if (nonPrimaryProperties.Any())
            {
                sb.AppendLine("WHEN MATCHED THEN");
                sb.Append("\tUPDATE SET ");
                sb.AppendJoin(", ", nonPrimaryProperties.Select(e => $"[{e.Name}] = src.[{e.Name}]"));
                sb.AppendLine();
            }
            sb.AppendLine("WHEN NOT MATCHED THEN");
            sb.Append("\tINSERT ( [");
            sb.AppendJoin("], [", modelProperties.Select(e => e.Name));
            sb.AppendLine($"] )");
            sb.Append("\tVALUES ( src.[");
            sb.AppendJoin("], src.[", modelProperties.Select(e => e.Name));
            sb.AppendLine("] )");
            sb.AppendLine("WHEN NOT MATCHED BY SOURCE THEN DELETE");
            sb.AppendLine(";");

            var values = entities.Select(db.Entry)
                .SelectMany(entry => modelProperties.Select(p => entry.CurrentValues[p]));
            return db.Database.ExecuteSqlCommand(sb.ToString(), values);
        }

        private static IEnumerable<Either<Property, Primitive, Item>> GetElements(Elements.Vertex v)
        {
            var propertiesStack = new Stack<(string, IEnumerable<Elements.Property>)>();
            propertiesStack.Push((v.Id, v.Properties));

            while (propertiesStack.Count > 0)
            {
                var (objectId, properties) = propertiesStack.Pop();
                foreach (var p in properties)
                {
                    var property =
                        new Property { Name = p.Name, ObjectId = objectId };
                    yield return property;

                    var valuesStack = new Stack<(string, GraphValue)>();
                    valuesStack.Push(($"{property.ObjectId}.{property.Name}", p.Value));

                    while (valuesStack.Count > 0)
                    {
                        var (valueId, value) = valuesStack.Pop();

                        if (value is GraphPrimitive prim)
                        {
                            yield return new Primitive
                            {
                                Id = valueId,
                                Value = JsonConvert.SerializeObject(prim.Value)
                            };
                        }
                        else if (value is Elements.GraphObject obj)
                        {
                            propertiesStack.Push((valueId, obj.Properties));
                        }
                        else if (value is GraphList list)
                        {
                            for(int i=0 ; i<list.Items.Count ; i++)
                            {
                                var item = list.Items[i];

                                var itemId = $"{valueId}.{i}";
                                yield return new Item { ItemId = itemId, ListId = valueId };

                                valuesStack.Push((itemId, item));
                            }
                        }
                    }
                }
            }
        }


        public static GraphCache Load(this GraphDbContext db)
        {
            return db.Load(new GraphCache());
        }

        public static IQueryable<T> UpdatedSince<T>(this IQueryable<T> queryable, DateTimeOffset? dateTime)
        {
            if (dateTime == null)
                return queryable;

            return queryable.Where(e => EF.Property<DateTimeOffset>(e, "LastUpdated") > dateTime);
        }

        //private static DateTimeOffset LastUpdated<T>(this GraphDbContext db, T entity) where T : class
        //{
        //    return db.Entry(entity).Property<DateTimeOffset>("LastUpdated").CurrentValue;
        //}

        //private static DateTimeOffset Max(this DateTimeOffset date1, DateTimeOffset date2)
        //{
        //    return date1 > date2 ? date1 : date2;
        //}

        public static GraphCache Load(this GraphDbContext db, GraphCache cache)
        {
            var dateTime = cache.LoadTime;
            cache.LoadTime = DateTimeOffset.UtcNow;

            foreach (var prim in db.Primitives.UpdatedSince(dateTime).AsNoTracking())
                cache.prims[prim.Id] = new GraphPrimitive(JsonConvert.DeserializeObject(prim.Value));

            foreach (var listId in db.Items.UpdatedSince(dateTime).Select(p => p.ListId).Distinct().AsNoTracking())
                cache.lists.TryAdd(listId, new GraphList());

            foreach (var vtx in db.Vertices.UpdatedSince(dateTime).AsNoTracking())
            {
                if (!cache.vertices.ContainsKey(vtx.Id))
                {
                    var vertex = new Elements.Vertex(vtx.Label) { Id = vtx.Id };
                    cache.Graph.Vertices.Add(vertex);
                    cache.vertices[vtx.Id] = vertex;
                }
            }

            var propertyGroups = db.Properties.UpdatedSince(dateTime).GroupBy(p => p.ObjectId).AsNoTracking().ToArray();
            foreach (var propertyGroup in propertyGroups)
            {
                var objectId = propertyGroup.Key;

                var obj =
                    cache.vertices.TryGetValue(objectId, null) ??
                    cache.objects.TryGetValue(objectId, null) ??
                    cache.objects.TryAddAndReturn(objectId, new Elements.GraphObject());

                if (obj == null)
                    throw new InvalidOperationException();
            }

            foreach (var propertyGroup in propertyGroups)
            {
                var objectId = propertyGroup.Key;

                var obj =
                    cache.vertices.TryGetValue(objectId, null) ??
                    cache.objects.TryGetValue(objectId, null);

                if (obj == null)
                    throw new InvalidOperationException();

                foreach (var property in propertyGroup)
                {
                    if (!obj.Properties.Any(prop => prop.Name.Equals(property.Name)))
                    {
                        var valueId = $"{property.ObjectId}.{property.Name}";
                        GraphValue graphValue =
                            cache.prims.TryGetValue(valueId, null) ??
                            cache.lists.TryGetValue(valueId, null) ??
                            cache.objects.TryGetValue(valueId, null) ??
                            GraphValue.Null;

                        obj.Properties.Add(new Elements.Property(property.Name, graphValue));
                    }
                }
            }

            foreach (var item in db.Items.UpdatedSince(dateTime).AsNoTracking())
            {
                if (cache.lists.TryGetValue(item.ListId, out var glist))
                {
                    var key = item.ItemId;
                    var gitem =
                            cache.prims.TryGetValue(key, null) ??
                            cache.objects.TryGetValue(key, null) ??
                            cache.lists.TryGetValue(key, null) ??
                            GraphValue.Null
                        ;
                    glist.Items.Add(gitem);
                }
                else
                    throw new InvalidOperationException();
            }

            foreach (var edge in db.Edges.UpdatedSince(dateTime).AsNoTracking())
            {
                cache.Graph.Edges.Add(new Elements.Edge(edge.Label) { Id = edge.Id, InV = edge.InV, OutV = edge.OutV });
            }

            return cache;
        }
    }

    public class GraphCache
    {
        public Dictionary<string, GraphPrimitive> prims;
        public Dictionary<string, GraphList> lists;
        public Dictionary<string, Elements.GraphObject> objects;
        public Dictionary<string, Elements.Vertex> vertices;
        public DateTimeOffset? LoadTime { get; set; }

        public GraphCache()
        {
            prims = new Dictionary<string, GraphPrimitive>();
            lists = new Dictionary<string, GraphList>();
            objects = new Dictionary<string, Elements.GraphObject>();
            vertices = new Dictionary<string, Elements.Vertex>();
            Graph = new Graph();
        }

        public Graph Graph { get; }
    }

    internal class Either<T0, T1, T2>
    {
        public object Value { get; private set; }

        public static implicit operator Either<T0, T1, T2>(T0 value)
        {
            return new Either<T0, T1, T2> { Value = value };
        }
        public static implicit operator Either<T0, T1, T2>(T1 value)
        {
            return new Either<T0, T1, T2> { Value = value };
        }
        public static implicit operator Either<T0, T1, T2>(T2 value)
        {
            return new Either<T0, T1, T2> { Value = value };
        }
    }

    internal class Either<T0, T1, T2, T3, T4>
    {
        public object Value { get; private set; }

        public static implicit operator Either<T0, T1, T2, T3, T4>(T0 value)
        {
            return new Either<T0, T1, T2, T3, T4> { Value = value };
        }
        public static implicit operator Either<T0, T1, T2, T3, T4>(T1 value)
        {
            return new Either<T0, T1, T2, T3, T4> { Value = value };
        }
        public static implicit operator Either<T0, T1, T2, T3, T4>(T2 value)
        {
            return new Either<T0, T1, T2, T3, T4> { Value = value };
        }
        public static implicit operator Either<T0, T1, T2, T3, T4>(T3 value)
        {
            return new Either<T0, T1, T2, T3, T4> { Value = value };
        }
        public static implicit operator Either<T0, T1, T2, T3, T4>(T4 value)
        {
            return new Either<T0, T1, T2, T3, T4> { Value = value };
        }
    }
}