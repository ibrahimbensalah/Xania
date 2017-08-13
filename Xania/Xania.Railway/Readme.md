After installing this package from nuget (Install-Package Railway.NET), you will be able to use the LINQ syntax to chain methods that 
return some 'Result' of T in an elegant way, the linq way, as if these were IEnumerable of T:

for example:

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
