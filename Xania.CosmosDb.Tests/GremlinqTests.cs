using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using NUnit.Framework;

namespace Xania.CosmosDb.Tests
{
    public class GremlinqTests
    {
        private Client _client;

        [SetUp]
        public void CreateClient()
        {
            var config = new ConfigurationBuilder().AddUserSecrets<GremlinqTests>().Build();
            var endpointUrl = config["xaniadb-endpointUrl"];
            var primaryKey = config["xaniadb-primarykey"].Secure();

            _client = new Client(endpointUrl, primaryKey);
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
            //var persons = _client.Query<Person>().Where(e => e.FirstName == "Ibrahim").ToArray();
            //Console.WriteLine(JsonConvert.SerializeObject(persons));
            var array =
                from p in _client.Query<Person>()
                where p.FirstName == "Ibrahim"
                select p;
            Console.WriteLine(JsonConvert.SerializeObject(array));
        }

        [Test]
        public void FilterByFriend()
        {
            var persons = _client.Query<Person>().Where(e => e.Friend.Id == 2).ToArray();
            Console.WriteLine(JsonConvert.SerializeObject(persons));
        }

        [Test]
        public void GremlinTest()
        {
            var g = "g.V().hasLabel('person').where(out('friend').has('id', '2')).optional(outE()).tree()";
            _client.ExecuteGremlinAsync(g).Wait();
        }

    }
}
