using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Newtonsoft.Json;
using Xania.Graphs.Elements;
using Xania.Reflection;

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
                        properties.Add(prop);
                    else if (element.Value is Item item)
                        items.Add(item);
                    else if (element.Value is Primitive prim)
                        primitives.Add(prim);
                }
            }

            db.Merge(properties);
            db.Merge(graph.Vertices.Select(v => new Relational.Vertex {Id = v.Id, Label = v.Label}).ToArray());
            db.Merge(items);
            db.Merge(primitives);
        }

        public static void Merge<TEntity>(this DbContext db, IList<TEntity> entities) where TEntity : class
        {
            var model = db.Model.FindEntityType(typeof(TEntity));
            var modelProperties = model.GetProperties().ToArray();

            var sb = new StringBuilder();

            var tableName = model.GetAnnotations().Where(a => a.Name.Equals("Relational:TableName"))
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
            var primaryProperties = model.GetKeys().Where(e => e.IsPrimaryKey()).SelectMany(e => e.Properties);
            sb.AppendJoin("\n\tAND ", primaryProperties.Select(key => $"src.[{key.Name}] = tar.[{key.Name}]"));
            sb.AppendLine();
            sb.AppendLine("WHEN NOT MATCHED THEN");
            sb.Append("\tINSERT ( [");
            sb.AppendJoin("], [", modelProperties.Select(e => e.Name));
            sb.AppendLine($"] )");
            sb.Append("\tVALUES ( src.[");
            sb.AppendJoin("], src.[", modelProperties.Select(e => e.Name));
            sb.AppendLine("] );");

            var values = entities.Select(db.Entry)
                .SelectMany(entry => modelProperties.Select(p => entry.CurrentValues[p]));
            db.Database.ExecuteSqlCommand(sb.ToString(), values);
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

                                var itemId = i.ToString();
                                yield return new Item { ItemId = itemId, ListId = valueId };

                                valuesStack.Push((itemId, item));
                            }
                        }
                    }
                }
            }
        }


        public static Graph LoadFull(this GraphDbContext db)
        {
            var g = new Graph();
            var values = new Dictionary<string, GraphValue>();

            foreach (var prim in db.Primitives.AsNoTracking())
                values.Add(prim.Id, new GraphPrimitive(JsonConvert.DeserializeObject(prim.Value)));

            foreach (var listId in db.Items.Select(p => p.ListId).Distinct().AsNoTracking())
                values.Add(listId, new GraphList());

            foreach (var v in db.Vertices.AsNoTracking())
            {
                var vertex = new Elements.Vertex(v.Label) { Id = v.Id };
                g.Vertices.Add(vertex);
                values.Add(v.Id, vertex);
            }

            foreach (var propertyGroup in db.Properties.GroupBy(p => p.ObjectId).AsNoTracking())
            {
                var objectId = propertyGroup.Key;
                var entry = values.TryGetValue(objectId, out var value)
                    ? value
                    : values.AddAndReturn(objectId, new Elements.GraphObject());

                if (entry is Elements.GraphObject obj)
                {
                    foreach (var property in propertyGroup)
                    {
                        var propertyValue = values.TryGetValue($"{property.ObjectId}.{property.Name}", out var result)
                            ? result
                            : GraphValue.Null;

                        obj.Properties.Add(new Elements.Property(property.Name, propertyValue));
                    }
                }
                else
                {
                    throw new InvalidOperationException();
                }
            }

            foreach (var item in db.Items.AsNoTracking())
            {
                if (values.TryGetValue(item.ListId, out var existing) && existing is GraphList glist)
                {
                    glist.Items.Add(values[item.ItemId]);
                }
                else
                {
                    throw new InvalidOperationException();
                }
            }

            foreach (var edge in db.Edges.AsNoTracking())
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