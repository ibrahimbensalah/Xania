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
            var persons = 
                from p in GremlinSetup.Client.Query<Person>()
                where p.Id == 1
                select p;
            var person = persons.Should().ContainSingle().Subject;

            AssertIbrahim(person);
        }

        [Test]
        public void FilterByFirstName()
        {
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
            GremlinSetup.Client
                .ExecuteGremlinAsync(
                    "g.V().hasLabel('person').as('p').out('friends').as('f').dedup().union(project('x', 't').by(identity()), outE())")
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
                from h in p.Friends
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
                select p;
            Console.WriteLine(JsonConvert.SerializeObject(view, Formatting.Indented));
        }
    }
}