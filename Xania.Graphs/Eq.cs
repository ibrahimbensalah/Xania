using System.Collections.Generic;

namespace Xania.Graphs
{
    public class Eq : Call
    {
        public Eq(params IStep[] steps) :
            base("eq", steps)
        {
        }

        public Eq(IEnumerable<IStep> steps) :
            base("eq", steps)
        {
        }
    }
}