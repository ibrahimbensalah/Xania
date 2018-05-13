using System.Linq;
using FluentAssertions;
using NUnit.Framework;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqDropTests
    {
        private static CosmosDbClient Db => GremlinSetup.CreateClient(nameof(GremlinqDropTests));

        [Test]
        public void DropIbrahim()
        {
            Db.Set<Person>().Where(e => e.Id == 1).Drop();
            Db.Set<Person>().Should().NotContain(e => e.Id == 1);
        }
    }
}