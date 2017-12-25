using System.Collections.Generic;

namespace Xania.Graphs
{
    public class Eq : Call
    {
        public Eq(params IStep[] expressions) :
            base("eq", expressions)
        {
        }

        public Eq(IEnumerable<IStep> expressions) :
            base("eq", expressions)
        {
        }
    }
}