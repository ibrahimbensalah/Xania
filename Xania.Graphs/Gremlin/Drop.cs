using System;

namespace Xania.Graphs.Gremlin
{
    public class Drop : IStep
    {
        public Drop()
        {
            Type = typeof(int);
        }

        public override string ToString()
        {
            return "drop()";
        }

        public Type Type { get; }
    }
}