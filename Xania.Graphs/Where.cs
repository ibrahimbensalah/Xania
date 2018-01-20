using System;

namespace Xania.Graphs
{
    public class Where : IStep
    {
        public GraphTraversal Predicate { get; }

        public Where(GraphTraversal predicate, Type type)
        {
            Predicate = predicate;
            Type = type;
        }

        public override string ToString()
        {
            return $"where({Predicate})";
        }

        public Type Type { get; }
    }
}