using System;
using FluentAssertions;
using NUnit.Framework;
using Xania.Railway;

namespace Xania.QL.Tests
{
    public class RailwayOrientedTests
    {
        [Test]
        public void LinqTest()
        {
            var age =
                from x in GetPerson("Ibrahim")
                from y in Validate(x)
                select GetAge(y);

            age.Should().BeAssignableTo<IFailure>()
                .Which.Message.Should().Be("Validation error");
        }

        public IMonad<Person>  Validate(Person p) => new ValidationError<Person>("Validation error");
        public IMonad<int>     GetAge(Person p) => Result.Success(p.Age);
        public IMonad<Person>  GetPerson(string firstName) => Result.Success(new Person { FirstName = firstName, Age = 36 });
    }

    public class ValidationError<T>: IMonad<T>, IFailure
    {
        public ValidationError(string message)
        {
            Message = message;
        }

        public string Message { get; }

        public IMonad<U> Map<U>(Func<T, U> _) => new ValidationError<U>(Message);
        public IMonad<U> Bind<U>(Func<T, IMonad<U>> _) => new ValidationError<U>(Message);
    }
}
