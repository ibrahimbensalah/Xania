using System;

namespace Xania.Graphs
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
