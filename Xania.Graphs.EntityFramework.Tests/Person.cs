using System.Collections.Generic;
using System.Collections.ObjectModel;
using Xania.Invoice.Domain;

namespace Xania.Graphs.EntityFramework.Tests
{
    public class Person
    {
        public int Id { get; set; }
        public ICollection<Person> Friends { get; set; }
        public string Name { get; set; }
        public ICollection<AddressLine> Lines { get; set; } = new Collection<AddressLine>();
        public Person Parent { get; set; }
    }
}