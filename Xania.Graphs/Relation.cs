using System;

namespace Xania.Graphs
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
            return $"({SourceId}) -> [{Name}({Id})] -> ({TargetId})";
        }
    }
}
