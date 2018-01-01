using System;

namespace Xania.Graphs.Structure
{
    public class Property
    {
        public GraphValue Value { get; }
        public string Name { get; }

        public Property(string name, GraphValue value)
        {
            Value = value;
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