using FluentAssertions;
using NUnit.Framework;
using Xania.Railway;

namespace Xania.QL.Tests
{
    public class TestClass
    {
        [Test]
        public void BindTest()
        {
            var getPerson = Operation.From<string, Person>(GetPerson);

            var age = "Ibrahim" |
                from x in getPerson
                from y in Validate(x)
                select GetAge(y);

            age.Should().BeAssignableTo<IFailure>()
                .Which.Message.Should().Be("Validation error");
        }

        public Result<Person> Validate(Person p) => Result.Failure<Person>("Validation error");

        public int GetAge(Person p) => p.Age;

        public Result<Person> GetPerson(string firstName) => Result.Success(new Person { FirstName = firstName, Age = 36 });

    }
}
