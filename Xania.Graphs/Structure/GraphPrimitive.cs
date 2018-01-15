using System;
using System.Collections.Generic;

namespace Xania.Graphs.Structure
{
    public class GraphPrimitive<T> : GraphValue
    {
        public GraphPrimitive(T value)
        {
            Value = value;
        }

        public T Value { get; }


        public override object ToClType()
        {
            return Value;
        }

        public override IExecuteResult Execute(IStep step, IEnumerable<(string name, IExecuteResult result)> mappings)
        {
            throw new NotImplementedException();
        }
    }
}