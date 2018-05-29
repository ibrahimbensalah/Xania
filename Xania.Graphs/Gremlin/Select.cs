using System;

namespace Xania.Graphs.Gremlin
{
    public class Select: IStep
    {
        public string Label { get; }

        public Select(string label, Type type)
        {
            Label = label;
            Type = type;
        }

        public override string ToString()
        {
            return $"select('{Label}')";
        }

        public Type Type { get; }
    }
}
