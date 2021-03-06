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

        private static void SetLastUpdated<T>(GraphDbContext db, T model) where T : class
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


        public static Graph Load(this GraphDbContext db)
        {
            var g = new Graph();
            db.Load(g, null);
            return g;
        }

        public static IQueryable<T> UpdatedSince<T>(this IQueryable<T> queryable, DateTimeOffset? dateTime)
        {
            if (dateTime == null)
                return queryable;

            return queryable.Where(e => EF.Property<DateTimeOffset>(e, "LastUpdated") > dateTime);
        }

        public static Graph Load(this GraphDbContext db, Graph g, DateTimeOffset? dateTime)
        {
            var prims = new Dictionary<string, GraphPrimitive>();
            var lists = new Dictionary<string, GraphList>();
            var objects = new Dictionary<string, Elements.GraphObject>();
            var vertices = new Dictionary<string, Elements.Vertex>();

            foreach (var prim in db.Primitives.UpdatedSince(dateTime).AsNoTracking())
                prims.Add(prim.Id, new GraphPrimitive(JsonConvert.DeserializeObject(prim.Value)));

            foreach (var listId in db.Items.UpdatedSince(dateTime).Select(p => p.ListId).Distinct().AsNoTracking())
                lists.Add(listId, new GraphList());

            foreach (var v in db.Vertices.UpdatedSince(dateTime).AsNoTracking())
            {
                var vertex = new Elements.Vertex(v.Label) { Id = v.Id };
                g.Vertices.Add(vertex);
                vertices.Add(v.Id, vertex);
            }

            var propertyGroups = db.Properties.UpdatedSince(dateTime).GroupBy(p => p.ObjectId).AsNoTracking().ToArray();
            foreach (var propertyGroup in propertyGroups)
            {
                var objectId = propertyGroup.Key;

                var obj =
                    vertices.TryGetValue(objectId, null) ??
                    objects.TryGetValue(objectId, null) ??
                    objects.AddAndReturn(objectId, new Elements.GraphObject());

                if (obj == null)
                    throw new InvalidOperationException();
            }

            foreach (var propertyGroup in propertyGroups)
            {
                var objectId = propertyGroup.Key;

                var obj =
                    vertices.TryGetValue(objectId, null) ??
                    objects.TryGetValue(objectId, null);

                if (obj == null)
                    throw new InvalidOperationException();

                foreach (var property in propertyGroup)
                {
                    var valueId = $"{property.ObjectId}.{property.Name}";
                    GraphValue graphValue =
                        prims.TryGetValue(valueId, null) ??
                        lists.TryGetValue(valueId, null) ??
                        objects.TryGetValue(valueId, null) ??
                        GraphValue.Null;

                    obj.Properties.Add(new Elements.Property(property.Name, graphValue));
                }
            }

            foreach (var item in db.Items.UpdatedSince(dateTime).AsNoTracking())
            {
                if (lists.TryGetValue(item.ListId, out var glist))
                {
                    var key = item.ItemId;
                    glist.Items.Add(
                        prims.TryGetValue(key, null) ??
                        objects.TryGetValue(key, null) ??
                        lists.TryGetValue(key, null) ??
                        GraphValue.Null
                    );
                }
                else
                    throw new InvalidOperationException();
            }

            foreach (var edge in db.Edges.UpdatedSince(dateTime).AsNoTracking())
            {
                g.Edges.Add(new Elements.Edge(edge.Label) { Id = edge.Id, InV = edge.InV, OutV = edge.OutV });
            }

            return g;
        }
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