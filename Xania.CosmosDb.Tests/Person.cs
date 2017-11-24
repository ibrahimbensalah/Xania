using System;
using System.Collections.Generic;

namespace Xania.CosmosDb.Tests
{
    public class Person: MarshalByRefObject
    {
        public int Id { get; set; }
        public Person Friend { get; set; }
        public string FirstName { get; set; }
        public Person Enemy { get; set; }
        public Address HQ { get; set; }
        public string[] Tags { get; set; }
        public ICollection<Person> Friends { get; } = new List<Person>();
    }
}