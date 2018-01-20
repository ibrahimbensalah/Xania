using System;

namespace Xania.Graphs
{
    public class Alias : IStep
    {
        public string Value { get; }

        public Alias(string value, Type type)
        {
            Value = value;
            Type = type;
        }

        public override string ToString()
        {
            return $"as('{Value}')";
        }

        public Type Type { get; }
    }
}