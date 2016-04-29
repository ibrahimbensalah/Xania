using System.Linq;
using FluentAssertions;
using NUnit.Framework;

namespace Xania.DataAccess.Tests
{
    public class BsonRepositoryTests
    {
        [Test]
        public void AddModelTest()
        {
            // arrange
            var repo = new BsonRepository<Person>(new MemoryStreamRepository())
            {
                new Person {FirstName = "1"},
                new Person {FirstName = "2"}
            };
            // act
            var firstNames = repo.Select(e => e.FirstName);
            // assert
            firstNames.Should().BeEquivalentTo("1", "2");
        }
    }

    internal class Person
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
