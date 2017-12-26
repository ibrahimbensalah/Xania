using System;
using System.Linq;
using System.Runtime.CompilerServices;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;
using Xania.Graphs;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqSelectTests
    {
        private static IQueryable<Person> People => GremlinSetup.CosmosDbClient.Set<Person>();

        [Test]
        public void NoFilter()
        {
            var persons = People.ToArray();
            var person1 = persons.Single(e => e.Id == 1);
            var person2 = persons.Single(e => e.Id == 2);

            // person1.Friends.Should().Contain(person2);

            var person3 = persons.Single(e => e.Id == 3);
            // person3.Friends.Should().Contain(person2);
        }

        [Test]
        public void FilterById()
        {
            var persons = 
                from p in People
                where p.Id == 1
                select p;
            var person = persons.Should().ContainSingle().Subject;

            AssertIbrahim(person);
        }

        [Test]
        public void FilterByFirstName()
        {
            var array =
                from p in People
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
                from p in People
                where p.Friend.Id == 2
                select p;

            var person = persons.Should().ContainSingle().Subject;
            AssertIbrahim(person);
        }

        [Test]
        public void GremlinTest()
        {
            GremlinSetup.CosmosDbClient.ExecuteGremlinAsync(
                "g.V().hasLabel('person').order().by(__.id(), incr)"
            ).Wait();
        }

        [Test]
        public void SelectFriends()
        {
            var persons =
                from p in People
                where p.Id == 1
                from f in p.Friends
                select f;
            var ibrahimsFriend = persons.Should().ContainSingle().Subject;
            ibrahimsFriend.Id.Should().Be(2);
        }

        [Test]
        public void SelectFriendOfFriends()
        {
            var persons =
                from p in People
                from f in p.Friends
                select f.Friend;
            Console.WriteLine(JsonConvert.SerializeObject(persons, Formatting.Indented));
        }

        [Test]
        public void SelectFriendOfFriendsOfFriends()
        {
            var persons =
                from p in People
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
        public void SelectEveryBody()
        {
            var everybody =
                from p in People
                select p;
            Console.WriteLine(JsonConvert.SerializeObject(everybody, Formatting.Indented));
        }

        [Test]
        public void SelectCustomColumns()
        {
            var view =
            (from p in People
                where p.Id == 1
                select new
                {
                    p.FirstName,
                    FriendId = p.Friend.Id
                }).ToArray();

            var ibrahim = view.Should().ContainSingle().Subject;
            // ibrahim.FirstName.Should().Be("Ibrahim");
            ibrahim.FriendId.Should().Be(2);

            Console.WriteLine(JsonConvert.SerializeObject(view, Formatting.Indented));
        }

        [Test]
        public void SelectCustomResultContainingOneVertex()
        {
            var view =
            (from p in People
                where p.Id == 1
                select new
                {
                    p.Friend
                }).ToArray();

            var ibrahim = view.Should().ContainSingle().Subject;
            ibrahim.Friend.Id.Should().Be(2);

            Console.WriteLine(JsonConvert.SerializeObject(view, Formatting.Indented));
        }

        [Test]
        public void SelectCustomResultContainingManyVertices()
        {
            var view =
            (from p in People
                where p.Id == 1
                select new {p.Friends}).ToArray();

            var ibrahim = view.Should().ContainSingle().Subject;
            ibrahim.Friends.Should().ContainSingle().Which.Id.Should().Be(2);

            Console.WriteLine(JsonConvert.SerializeObject(view, Formatting.Indented));
        }

        [Test]
        public void SelectCustomResultWithNested()
        {
            var view =
            (from p in People
                where p.Id == 1
                select new {Composite = new {Person = p}}).ToArray();

            var ibrahim = view.Should().ContainSingle().Subject.Composite.Person;
            AssertIbrahim(ibrahim);

            Console.WriteLine(JsonConvert.SerializeObject(view, Formatting.Indented));
        }
    }
}