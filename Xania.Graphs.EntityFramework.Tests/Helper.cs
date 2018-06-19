using System;
using System.Collections.Generic;
using System.Text;
using Xania.Invoice.Domain;

namespace Xania.Graphs.EntityFramework.Tests
{
    public static class Helper
    {
        public static Graph GetGraph()
        {
            return Graph.FromObject(
                new Person
                {
                    Id = 1,
                    Name = "Person 1",
                    Main = new AddressLine(),
                    Parent = new Person() { Id = 4, Name="Person 4"},
                    Friends = new[] { new Person { Id = 2, Name = "Person 2" }, new Person { Id = 3, Name = "Person 3" } },
                    Lines = new List<AddressLine>
                    {
                        new AddressLine {Value = "Punter 315", Type = AddressType.Street},
                        new AddressLine {Value = "Amstelveen", Type = AddressType.Location},
                        new AddressLine {Value = "1186 PW", Type = AddressType.ZipCode},
                    }
                }
            );
        }

        public static TValue TryGetValue<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key, TValue defaultValue)
        {
            return dictionary.TryGetValue(key, out var value) ? value : defaultValue;
        }
    }
}
