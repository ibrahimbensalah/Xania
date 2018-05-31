using System;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class GraphPrimitive: GraphValue
    {
        public GraphPrimitive(object value)
        {
            Value = value;
        }

        public object Value { get; }

        public override bool Equals(object obj)
        {
            if (obj == null)
                return false;

            return Value.Equals(obj);
        }

        protected bool Equals(GraphPrimitive other)
        {
            return Equals(Value, other.Value);
        }

        public override int GetHashCode()
        {
            return Value != null ? Value.GetHashCode() : 0;
        }

        public override string ToString()
        {
            return Value.ToString();
        }
    }
}