using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class Property
    {
        private string _name;
        public string Name => _name;

        public GraphValue Value { get; }

        public Property(string name, GraphValue value)
        {
            _name = name.ToCamelCase();
            Value = value;
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
}