using System;

namespace Xania.Graphs.Structure
{
    public class Property
    {
        public object Value { get; }
        public string Name { get; }

        public Property(string name, object value)
        {
            if (value is GraphValue)
                throw new NotSupportedException();
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