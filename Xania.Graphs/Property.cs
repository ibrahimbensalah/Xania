using System;

namespace Xania.Graphs
{
    public class Property
    {
        public object Value { get; }
        public string Name { get; }

        public Property(string name, object value)
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
            if (obj is Property)
                return ((Property)obj).Name.Equals(Name, StringComparison.InvariantCultureIgnoreCase);
            return false;
        }
    }
}