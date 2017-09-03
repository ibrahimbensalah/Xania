using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;

namespace Xania.DataAccess.Tests
{
    public class BsonRepositoryTests
    {
        [Test]
        public void Test()
        {
            Console.WriteLine("test 1");
            AddModelTest();
            Console.WriteLine("test 2");
            Thread.Sleep(2000);
        }

        [Test]
        public async void AddModelTest()
        {
            // arrange
            var store = new DocumentObjectStore<Person>(new MemoryDocumentStore());

            await store.AddAsync(new Person {FirstName = "1"});
            await store.AddAsync(new Person {FirstName = "2"});
            // act
            var firstNames = store.Select(e => e.FirstName);
            // assert
            firstNames.Should().BeEquivalentTo("1", "2");
            await Task.Delay(TimeSpan.FromSeconds(1));
            Console.WriteLine("test inside");
        }
    }

    internal class Person
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
