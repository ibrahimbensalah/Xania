using System;
using System.Collections.Generic;

namespace Xania.Graphs
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