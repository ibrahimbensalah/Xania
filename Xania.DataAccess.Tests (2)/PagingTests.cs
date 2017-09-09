//using System.Linq;
//using FluentAssertions;
//using NUnit.Framework;

//namespace Xania.DataAccess.Tests
//{
//    public class PagingTests
//    {
//        private IQueryable<Person> _persons;

//        [SetUp]
//        public void Persons()
//        {
//            _persons = new[]
//            {
//                new Person {FirstName = "Ibrahim", LastName = "ben Salah"},
//                new Person {FirstName = "Abeer", LastName = "Mahdi"},
//                new Person {FirstName = "Ramy", LastName = "ben Salah"},
//                new Person {FirstName = "Rania", LastName = "ben Salah"}
//            }.AsQueryable();

//        }

//        //[Test]
//        //public void OrderByDynamicFieldTest()
//        //{
//        //    var ordered = _persons.OrderBy("First name");
//        //    ordered.Select(e => e.FirstName).Should().BeInAscendingOrder();
//        //}

//        //[Test]
//        //public void ToPageResultTest()
//        //{
//        //    var request = new PageRequest<DefaultRequestFilter>()
//        //    {
//        //        Filter = new DefaultRequestFilter { {"first name", "Ibrahim"} }
//        //    };

//        //    var page = _persons.ToPageResult(request);
//        //    page.Total.Should().Be(1);
//        //    page.Data.Single().FirstName.Should().Be("Ibrahim");
//        //}

//        class Person
//        {
//            public string FirstName { get; set; }

//            public string LastName { get; set; }
//        }
//    }
//}
