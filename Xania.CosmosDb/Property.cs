using System;
using System.Collections.Generic;

namespace Xania.CosmosDb
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