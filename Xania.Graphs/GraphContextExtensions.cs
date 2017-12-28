using Xania.Graphs.Linq;

namespace Xania.Graphs
{
    public static class GraphContextExtensions
    {
        public static GraphQueryable<TModel> Set<TModel>(this IGraphDataContext client)
        {
            return new GraphQueryable<TModel>(new GraphQueryProvider(client));
        }
    }
}
