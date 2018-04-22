using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
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

        public static IGraphQuery Execute(this IGraphQuery g, GraphTraversal traversal)
        {
            var maps = new(string name, IGraphQuery expr)[0];
            var (result, _, _) = traversal.Steps.Aggregate((g, typeof(object), maps), (__, step) =>
            {
                var (query, t, m) = __;
                if (step is Alias a)
                    return (query, t, m.Prepend((a.Value, query)).ToArray());

                if (step is Context)
                    return __;

                if (step is Select select)
                {
                    var q = m.Select(select.Label);
                    return (q, t, m);
                }

                var next = query.Next(t, step, m.Select(x => (x.name, x.expr.SourceExpression)));
                return (next, step.Type, m);
            });
            
            return result;
        }
    }
}
