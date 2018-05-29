using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Xania.Graphs.Gremlin
{
    public static class TraversalExtensions
    {
        public static GraphTraversal Replace(this GraphTraversal graphTraversal, Func<IStep, bool> predicate,
            IStep replacement)
        {
            return new GraphTraversal(graphTraversal.Steps.Select(e => predicate(e) ? replacement : e));
        }

        public static IEnumerable<IStep> Replace(this IEnumerable<IStep> steps, Func<IStep, bool> predicate,
            Func<IStep, IStep> replace)
        {
            return steps.Select(e => predicate(e) ? replace(e) : e);
        }

        public static string Join<T>(this IEnumerable<T> source, string separator)
        {
            return source.Aggregate(new StringBuilder(), (sb, e) => sb.Length > 0 ? sb.Append(separator).Append(e) : sb.Append(e)).ToString();
        }

        public static Type GetType(this GraphTraversal graphTraversal)
        {
            return graphTraversal.Steps.Last().Type;
        }
    }
}