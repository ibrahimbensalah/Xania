using System;
using System.Collections.Generic;
using System.Linq;
using Xania.Graphs.Linq;
using Xania.Graphs.Structure;

namespace Xania.Graphs
{
    public static class GraphContextExtensions
    {
        public static GraphQueryable<TModel> Set<TModel>(this IGraphDataContext client)
        {
            return new GraphQueryable<TModel>(new GraphQueryProvider(client));
        }

        public static IGraphQuery Execute(this IGraphQuery g, GraphTraversal traversal, (string name, IGraphQuery result)[] maps = null)
        {
            maps = maps ?? new(string name, IGraphQuery result)[0];
            var (result, _, _) = traversal.Steps.Aggregate((g, typeof(object), maps), (__, step) =>
            {
                var (r, t, m) = __;
                if (step is Alias a)
                    return (r, t, m.Prepend((a.Value, r)).ToArray());

                if (step is Context)
                    return __;

                if (step is Select select)
                {
                    var q = m.Select(select.Label);
                    return (q, t, m);
                }

                var stepQuery = r.Next(t, step);
                return (stepQuery.Query(r.Expression), step.Type, m);
            });
            
            return result;
        }
    }
}
