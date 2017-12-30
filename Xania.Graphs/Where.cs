using System;

namespace Xania.Graphs
{
    public class Where : IStep
    {
        public GraphTraversal Predicate { get; }

        public Where(GraphTraversal predicate)
        {
            Predicate = predicate;
        }

        public override string ToString()
        {
            return $"where({Predicate})";
        }
    }
}