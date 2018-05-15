using System;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class GraphPrimitive: GraphValue
    {
        public GraphPrimitive(Type type, object value)
        {
            Type = type;
            Value = value;
        }

        public Type Type { get; }
        public object Value { get; }

        public override bool Equals(object obj)
        {
            if (obj == null)
                return false;

            return Value.Equals(obj);
        }

        protected bool Equals(GraphPrimitive other)
        {
            return Equals(Type, other.Type) && Equals(Value, other.Value);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                return ((Type != null ? Type.GetHashCode() : 0) * 397) ^ (Value != null ? Value.GetHashCode() : 0);
            }
        }

        public override string ToString()
        {
            return Value.ToString();
        }
    }
}