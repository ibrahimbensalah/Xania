using System.Diagnostics;
using System.Linq;
using Xania.Graphs.Gremlin;

namespace Xania.Graphs.Linq
{
    public static class GraphContextExtensions
    {
        public static GenericQueryable<TModel> Set<TModel>(this IGraphDataContext dataContext)
        {
            return new GenericQueryable<TModel>(new GremlinQueryProvider(dataContext));
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
                    m.Select(select.Label);
                    // var q = m.Select(select.Label);
                    return __;
                }

                var next = query.Next(t, step, m.Select(x => (x.name, x.expr.SourceExpression)));
                if (next == null)
                    Debugger.Break();

                return (next, step.Type, m);
            });
            
            return result;
        }
    }
}
