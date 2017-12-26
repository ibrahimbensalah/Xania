using System.Linq;
using Xania.Graphs;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqPagingByTests
    {
        private static IQueryable<Person> People => GremlinSetup.CosmosDbClient.Set<Person>();

    }
}