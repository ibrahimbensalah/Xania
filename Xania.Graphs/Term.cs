using System;
using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class Term : IStep
    {
        private readonly IEnumerable<IStep> _steps;

        public Term(IEnumerable<IStep> steps)
        {
            _steps = steps;
            throw new NotImplementedException();
        }

        public override string ToString()
        {
            return string.Join(".", _steps.Select(e => e.ToString()));
        }

        public Type Type { get; }
    }
}
