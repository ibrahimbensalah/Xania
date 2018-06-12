using System;
using System.Collections.Generic;
using System.Text;

namespace Xania.Graphs.EntityFramework.Tests.Relational
{
    public class Edge
    {
        public string Id { get; set; }
        public string InV { get; set; }
        public string OutV { get; set; }
        public string Label { get; set; }
    }
}
