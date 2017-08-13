using System;
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

        public ValidationError<Person> Validate(Person p) => new ValidationError<Person>("Validation error");

        public int GetAge(Person p) => p.Age;

        public Result<Person> GetPerson(string firstName) => Result.Success(new Person { FirstName = firstName, Age = 36 });

    }

    public class ValidationError<T>: IMonad<T>, IFailure
    {
        public ValidationError(string message)
        {
            this.Message = message;
        }

        public IMonad<U> Map<U>(Func<T, IMonad<U>> func)
        {
            return new ValidationError<U>(this.Message);
        }

        public string Message { get; }
        public Exception Exception { get; }
    }
}
