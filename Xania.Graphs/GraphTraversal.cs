using System;
using System.Collections.Generic;
using System.Linq;
using Xania.Reflection;

namespace Xania.Graphs
{
    public class GraphTraversal
    {
        public IEnumerable<IStep> Steps { get; }
        public Type StepType => Steps.Last().Type;

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
                yield return $"{String.Join(".", Steps.Select(e => e.ToString()))}";
        }

        public GraphTraversal Append(IStep expr)
        {
            if (expr is Values)
                return new GraphTraversal (Steps.Append(expr)) { };
            return new GraphTraversal(Steps.Append(expr)) { };
        }

        public GraphTraversal Bind(GraphTraversal other)
        {
            var otherSteps = (other.Steps.FirstOrDefault() is Context)
                ? other.Steps.Skip(1).ToArray()
                : other.Steps.ToArray();

            if (Steps.LastOrDefault() is Alias l)
            {
                return new GraphTraversal(Steps.Concat(Optimize(otherSteps, l.Value)));
            }

            return new GraphTraversal(Steps.Concat(otherSteps))
            {
            };
        }

        private static IEnumerable<IStep> Optimize(IEnumerable<IStep> otherSteps, string @alias)
        {
            var otherFirst = otherSteps.FirstOrDefault();
            if (otherFirst is Select select)
            {
                if (@select.Label.Equals(alias))
                    return otherSteps.Skip(1);
            }
            else if (otherFirst is Project project)
            {
                var o = new Project(project.Dict.ToDictionary(e => e.Key, e => Optimize(e.Value, alias)));
                return otherSteps.Skip(1).Prepend(o);
            }

            return otherSteps;
        }

        private static GraphTraversal Optimize(GraphTraversal traversal, string alias)
        {
            var steps = Optimize(traversal.Steps, alias).ToArray();
            if (steps.Any())
                return new GraphTraversal(steps);
            else
                return new GraphTraversal(new Context(traversal.StepType));
        }
    }
}