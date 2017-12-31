using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class GraphTraversal
    {
        public IEnumerable<IStep> Steps { get; }

        public GraphTraversal(IStep step)
            : this(new[] { step })
        {
        }

        public GraphTraversal(IEnumerable<IStep> steps)
        {
            Steps = steps;
        }

        public override string ToString()
        {
            return ToGremlinSelector().Join(".");
        }

        private IEnumerable<string> ToGremlinSelector()
        {
            if (Steps.Any())
                yield return $"{string.Join(".", Steps.Select(e => e.ToString()))}";
        }

        public static readonly Context __ = new Context();

        public GraphTraversal Append(IStep expr)
        {
            if (expr is Values)
                return new GraphTraversal (Steps.Append(expr)) { };
            return new GraphTraversal(Steps.Append(expr)) { };
        }

        public GraphTraversal Bind(GraphTraversal other)
        {
            var otherSteps = (other.Steps.FirstOrDefault() is Context) ? other.Steps.Skip(1).ToArray() : other.Steps.ToArray();

            if (Steps.LastOrDefault() is Alias l)
            {
                if (!otherSteps.Any(e => e is Select s && s.Label.Equals(l.Value)))
                    return new GraphTraversal(Steps.Concat(otherSteps))
                    {
                    };
                if (otherSteps.FirstOrDefault() is Select f && f.Label.Equals(l.Value))
                    return new GraphTraversal(Steps.Concat(otherSteps.Skip(1)))
                    {
                    };
            }

            return new GraphTraversal(Steps.Concat(otherSteps))
            {
            };
        }
    }
}