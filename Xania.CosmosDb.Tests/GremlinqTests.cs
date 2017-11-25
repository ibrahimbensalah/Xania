using System;
using System.Linq;
using System.Security;
using NUnit.Framework;

namespace Xania.CosmosDb.Tests
{
    public class GremlinqTests
    {
        private Client _client;
        private readonly string EndpointUrl = "https://xania-sql.documents.azure.com:443/";
        private readonly SecureString PrimaryKey = "xiq9QJQ2naMaqrkbWlu5yxL8N3PTIST0dJuwjHqsei1psDvdGGWfEsGO9I0dP3HuJvXbMXjle4galX0VrcV0FA==".Secure();

        [SetUp]
        public void CreateClient()
        {
            _client = new Client(EndpointUrl, PrimaryKey);
            _client.Log += Console.WriteLine;
        }

        [TearDown]
        public void DisposeClient()
        {
            _client.Dispose();
        }

        [Test]
        public void FilterById()
        {
            var persons = _client.Query<Person>().Where(e => e.Id == 1).ToArray();
        }

        [Test]
        public void FilterByFirstName()
        {
            var persons = _client.Query<Person>().Where(e => e.FirstName == "Ibrahim").ToArray();
        }

        [Test]
        public void FilterByFriend()
        {
            var persons = _client.Query<Person>().Where(e => e.Friend.Id == 2).ToArray();
        }

        [Test]
        public void GremlinTest()
        {
            var g = "g.V().hasLabel('person').where(out('friend').has('id', '2')).optional(outE()).tree()";
            _client.ExecuteGremlinAsync(g).Wait();
        }

    }
}
