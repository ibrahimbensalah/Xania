using System;
using System.Linq;
using System.Runtime.CompilerServices;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqTests
    {

        [Test]
        public void NoFilter()
        {
            var persons = GremlinSetup.Client.Query<Person>().ToArray();
            var person1 = persons.Single(e => e.Id == 1);
            var person2 = persons.Single(e => e.Id == 2);

            person1.Friends.Should().Contain(person2);

            var person3 = persons.Single(e => e.Id == 3);
            person3.Friends.Should().Contain(person2);
        }

        [Test]
        public void FilterById()
        {
            var persons = GremlinSetup.Client.Query<Person>().Where(e => e.Id == 1).ToArray();
            var person = persons.Should().ContainSingle().Subject;

            AssertIbrahim(person);
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
            var person = array.Should().ContainSingle().Subject;

            AssertIbrahim(person);
        }

        private static void AssertIbrahim(Person person)
        {
            person.Id.Should().Be(1);
            person.FirstName.Should().Be("Ibrahim");
            person.Friend.Should().NotBeNull();
            person.Enemy.Should().NotBeNull();
            person.Friends.Should().HaveCount(1);
        }

        [Test]
        public void FilterByFriend()
        {
            var persons =
                from p in GremlinSetup.Client.Query<Person>()
                where p.Friend.Id == 2
                select p;

            var person = persons.Should().ContainSingle().Subject;
            AssertIbrahim(person);
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
            // var g = "g.V().hasLabel('person').as('p').select('p').out('friends').optional(outE()).tree()";
            // var g = "g.V().hasLabel('person').as('p').out('friends').as('f').union(select('f'), select('f').outE())";
            GremlinSetup.Client
                // .ExecuteGremlinAsync("g.V().hasLabel('person').where(has('firstName', 'Ibrahim')).union(identity(), outE())")
                .ExecuteGremlinAsync(
                    "g.V().hasLabel(\"person\").has(\"id\",eq(1)).union(identity(), outE())")
                .Wait();
        }

        [Test]
        public void SelectFriends()
        {
            var persons =
                from p in GremlinSetup.Client.Query<Person>()
                from f in p.Friends
                select f;
            persons.Should().HaveCount(3);
        }

        [Test]
        public void SelectFriendOfFriends()
        {
            var persons =
                from p in GremlinSetup.Client.Query<Person>()
                from f in p.Friends
                select f.Friend;
            Console.WriteLine(JsonConvert.SerializeObject(persons, Formatting.Indented));
        }

        [Test]
        public void SelectFriendOfFriendsOfFriends()
        {
            var persons =
                from p in GremlinSetup.Client.Query<Person>()
                from f in p.Friends
                from g in f.Friends
                from h in g.Friends
                select h.Friend;
            Console.WriteLine(JsonConvert.SerializeObject(persons, Formatting.Indented));
        }

        [Test]
        public void AnonymousType()
        {
            var anonType = new { a = 1, b = 2 }.GetType();
            anonType.CustomAttributes.Select(e => e.AttributeType).Should().Contain(typeof(CompilerGeneratedAttribute));
        }

        [Test]
        public void SelectCustomColumns()
        {
            var view =
                from p in GremlinSetup.Client.Query<Person>()
                select new
                {
                    FirstName = p.FirstName,
                    FriendId = p.Friend.Id
                };
            Console.WriteLine(JsonConvert.SerializeObject(view, Formatting.Indented));
        }
    }
}