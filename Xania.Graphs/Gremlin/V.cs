using System;

namespace Xania.Graphs.Gremlin
{
    public class V : IStep
    {
        public string Label { get; }

        public V(Type type)
        {
            Label = type.Name.ToCamelCase();
            Type = type;
        }

        public override string ToString()
        {
            return $"V().hasLabel('{Label}')";
        }

        public Type Type { get; }
    }
}