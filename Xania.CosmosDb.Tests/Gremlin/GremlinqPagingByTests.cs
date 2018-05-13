using System.Linq;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqPagingByTests
    {
        private static IQueryable<Person> People => GremlinSetup.CreateClient(nameof(GremlinqPagingByTests)).Set<Person>();

    }
}