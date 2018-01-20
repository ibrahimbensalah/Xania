using System;
using System.Linq;

namespace Xania.Graphs
{
    public class Bind : IStep
    {
        public IStep[] Expressions { get; }

        public Bind(IStep[] expressions)
        {
            throw new NotImplementedException();
            Expressions = expressions;
        }

        public override string ToString()
        {
            return string.Join(".", Expressions.Select(e => e.ToString()));
        }

        public Type Type { get; }
    }
}