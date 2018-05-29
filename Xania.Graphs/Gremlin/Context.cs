using System;

namespace Xania.Graphs.Gremlin
{
    public class Context : IStep
    {
        public Context(Type type)
        {
            Type = type;
        }

        public override string ToString()
        {
            return "__";
        }

        public Type Type { get; }
    }
}
