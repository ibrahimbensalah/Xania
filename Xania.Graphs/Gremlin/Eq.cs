using System;

namespace Xania.Graphs.Gremlin
{
    public class Eq : IStep
    {
        public IStep Value { get; }

        public Eq(IStep value)
        {
            Value = value;
        }

        public override string ToString()
        {
            return $"eq({Value})";
        }

        public Type Type => typeof(bool);
    }
}