using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using Xania.Graphs;

namespace Xania.CosmosDb.Tests.Gremlin
{
    public class GremlinqOrderByTests
    {
        private static IQueryable<Person> People => GremlinSetup.CreateClient(nameof(GremlinqOrderByTests)).Set<Person>();

        [Test]
        public void OrderById()
        {
            var persons = People.OrderBy(e => e.Id).ToArray();
            persons.Should().BeInAscendingOrder(e => e.Id);
        }

        [Test]
        public void OrderByIdDescending()
        {
            var persons = People.OrderByDescending(e => e.Id).ToArray();
            persons.Should().BeInDescendingOrder(e => e.Id);
        }

        [Test]
        public void OrderByFriendId()
        {
            var persons = People.OrderBy(e => e.Friend.Id).ToArray();
            persons.Should().BeInAscendingOrder(e => e.Id);
        }

        [Test]
        public void OrderByFriendIdDescending()
        {
            var persons = People.OrderByDescending(e => e.Friend.Id).ToArray();
            persons.Should().BeInDescendingOrder(e => e.Id);
        }
    }
}