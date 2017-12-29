using System.Collections.Generic;

namespace Xania.Graphs
{
    public class Is : Call
    {
        public Is(params IStep[] steps) :
            base("is", steps)
        {
        }

        public Is(IEnumerable<IStep> steps) : 
            base("is", steps)
        {
        }
    }
}