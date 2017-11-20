using System;

namespace Xania.CosmosDb
{
    public class Relation
    {
        public string Name { get; }
        public string SourceId { get; set; }
        public string TargetId { get; set; }
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public Relation(string sourceId, string name, string targetId)
        {
            SourceId = sourceId;
            TargetId = targetId;
            Name = name.ToCamelCase();
        }

        public override string ToString()
        {
            return $"{SourceId}->{Name}({Id})->{TargetId}";
        }
    }

    public class Relation<T>: IRelation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public T Target { get; set; }

        object IRelation.Target => Target;

        public Relation(T target)
        {
            Target = target;
        }

        public static implicit operator Relation<T>(T target)
        {
            return new Relation<T>(target);
        }
    }

    public interface IRelation
    {
        object Target { get; }
        string Id { get; }
    }
}
