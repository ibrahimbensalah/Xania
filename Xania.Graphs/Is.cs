using System.Collections.Generic;

namespace Xania.Graphs
{
    public class Is : Call
    {
        public Is(params IStep[] expressions) :
            base("is", expressions)
        {
        }

        public Is(IEnumerable<IStep> expressions) : 
            base("is", expressions)
        {
        }
    }
}