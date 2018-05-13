using System;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class Property
    {
        public string Name { get; }
        public GraphValue Value2 { get; }

        public Property(string name, GraphValue value)
        {
            Value2 = value;
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
}