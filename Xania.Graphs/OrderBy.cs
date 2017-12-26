﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.Graphs
{
    public class OrderBy : IStep
    {
        private readonly bool _ascending;
        private readonly GraphTraversal _traversal;

        public OrderBy(bool ascending, GraphTraversal traversal)
        {
            _ascending = @ascending;
            _traversal = traversal;
        }

        public override string ToString()
        {
            var gremlin = $"order().by({_traversal}, {(_ascending ? "incr" : "decr")})";
            var baseSteps = _traversal.Steps.Reverse().SkipWhile(e => !(e is Out)).Reverse().ToArray();
            if (baseSteps.Any())
                gremlin = $"where({baseSteps.Join(".")}).{gremlin}";

            return gremlin;
        }
    }
}
