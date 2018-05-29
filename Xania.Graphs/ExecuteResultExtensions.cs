using System;
using System.Collections.Generic;
using System.Linq;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Linq;

namespace Xania.Graphs
{
    public static class ExecuteResultExtensions
    {
        public static IExecuteResult Execute(this IExecuteResult input, GraphTraversal traversal, IEnumerable<(string name, IExecuteResult result)> mappings)
        {
            var (result, _) = traversal.Steps.Aggregate((input:input, mappings:mappings), (__, step) =>
            {
                var (r, m) = __;
                if (step is Alias a)
                    return (r, m.Prepend((a.Value, r)));

                if (step is Context)
                    return __;

                var list = m.ToArray();
                if (step is Select select)
                {
                    return (list.Select(select.Label), list);
                }

                return (r.Execute(step, list), list);
            });

            return result;
        }

        public static TResult Select<TResult>(this IEnumerable<(string name, TResult result)> mappings, string name)
        {
            return mappings.Where(e => e.name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                .Select(e => e.result).FirstOrDefault();
        }
    }
}