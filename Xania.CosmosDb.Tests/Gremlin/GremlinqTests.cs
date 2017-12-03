using System;
using System.Linq;
using Newtonsoft.Json;
using NUnit.Framework;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqTests {

        [Test]
        public void NoFilter()
        {
            var persons = GremlinSetup.Client.Query<Person>().ToArray();
        }

        [Test]
        public void FilterById()
        {
            var persons = GremlinSetup.Client.Query<Person>().Where(e => e.Id == 1).ToArray();
        }

        [Test]
        public void FilterByFirstName()
        {
            //var persons = _client.Query<Person>().Where(e => e.FirstName == "Ibrahim").ToArray();
            //Console.WriteLine(JsonConvert.SerializeObject(persons));
            var array =
                from p in GremlinSetup.Client.Query<Person>()
                where p.FirstName == "Ibrahim"
                select p;
            Console.WriteLine(JsonConvert.SerializeObject(array));
        }

        [Test]
        public void FilterByFriend()
        {
            var persons =
                from p in GremlinSetup.Client.Query<Person>()
                where p.Friend.Id == 2
                select p;
            Console.WriteLine(JsonConvert.SerializeObject(persons));
        }

        [Test]
        public void GremlinTest()
        {
            // var g = "g.V().hasLabel('person').has('id', '2').in('friend').hasLabel('person')";
            // var g = "g.V().hasLabel('person').as('p').where(firstName.is(eq('Ibrahim')))";
            // var g = "g.V().hasLabel('person').out('friends').hasLabel('person').values('id').tree()";
            // var g = "g.V('3').hasLabel('person').union(outE(), out('friends'))";
            // var g = "g.V('1').as('v').hasLabel('person').select('v').optional(outE()).tree()";
            // var g = "g.V().hasLabel('person').as('p').where(has('firstName', 'Ibrahim')).optional(outE()).tree()";
            var g = "g.V().hasLabel('person').as('p').select('p').out('friends').optional(outE()).tree()";
            GremlinSetup.Client.ExecuteGremlinAsync(g).Wait();
        }

        [Test]
        public void SelectFriends()
        {
            var persons =
                from p in GremlinSetup.Client.Query<Person>()
                from f in p.Friends
                select p;
            Console.WriteLine(JsonConvert.SerializeObject(persons));
        }

    }
}