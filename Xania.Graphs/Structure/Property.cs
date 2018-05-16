using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class Property
    {
        public string Name { get; }
        public PropertyValue Value { get; }

        public Property(string name, GraphValue value)
        {
            Value = new PropertyValue {Value = value, Id = value.GenerateChecksum()};
            Name = name.ToCamelCase();
        }

        public override int GetHashCode()
        {
            return Name.GetHashCode();
        }

        public override bool Equals(object obj)
        {
            if (obj is Property property)
                return property.Name.Equals(Name, StringComparison.InvariantCultureIgnoreCase);
            return false;
        }
    }

    public class PropertyValue
    {
        public GraphValue Value { get; set; }
        public string Id { get; set; }
    }
}