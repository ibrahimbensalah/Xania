using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class Call : IStep
    {
        public string MethodName { get; }
        private readonly IEnumerable<IStep> _expressions;

        public Call(string methodName, params IStep[] expressions)
        {
            MethodName = methodName;
            _expressions = expressions;
        }

        public Call(string methodName, IEnumerable<IStep> expressions)
        {
            MethodName = methodName;
            _expressions = expressions;
        }

        public override string ToString()
        {
            return $"{MethodName}({string.Join(",", _expressions.Select(e => e.ToString()))})";
        }
    }
}
