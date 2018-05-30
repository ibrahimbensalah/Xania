using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xania.Graphs.Linq;
using Xania.Graphs.Runtime.Tests;

namespace Xania.Graphs.Runtime.Tests
{
    public class GremlinSelectTests: SelectBaseTests
    {
        private readonly Graph Graph = TestData.GetPeople();
        private InMemoryGraphDataContext Data => new InMemoryGraphDataContext(Graph);
        // private abstract GenericQueryable<Person> People => Data.Set<Person>();

        protected override IQueryable<Person> People => Data.Set<Person>();
    }

    public class GraphSelectTests: SelectBaseTests
    {
        private readonly Graph Graph = TestData.GetPeople();
        // private abstract GenericQueryable<Person> People => Data.Set<Person>();

        protected override IQueryable<Person> People => Graph.Set<Person>();
    }
}
