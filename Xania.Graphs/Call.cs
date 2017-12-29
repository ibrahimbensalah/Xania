using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class Call : IStep
    {
        public string MethodName { get; }
        public IEnumerable<IStep> Steps { get; }

        public Call(string methodName, params IStep[] steps)
        {
            MethodName = methodName;
            Steps = steps;
        }

        public Call(string methodName, IEnumerable<IStep> steps)
        {
            MethodName = methodName;
            Steps = steps;
        }

        public override string ToString()
        {
            return $"{MethodName}({string.Join(",", Steps.Select(e => e.ToString()))})";
        }
    }
}
