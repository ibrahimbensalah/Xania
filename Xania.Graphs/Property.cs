using System;

namespace Xania.Graphs
{
    public class Property
    {
        public Tuple<string, object>[] Values { get; }
        public string Name { get; }

        public Property(string name, params Tuple<string, object>[] values)
        {
            Values = values;
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