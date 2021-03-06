﻿using System;
using System.Linq;
using System.Linq.Expressions;
using NUnit.Framework;
using Xania.Graphs.Linq;

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

    public class ReflectionTests
    {
        [Test]
        public void InferLambdaTest()
        {
            var argTypes =
                new[]
                {
                    typeof(IQueryable<Elements.Vertex>),
                    typeof(Expression<Func<Elements.Vertex, IQueryable<Elements.Vertex>>>),
                    typeof(Expression<Func<Elements.Vertex, Elements.Vertex, Int32>>)
                };

            var declaringType = typeof(Queryable);

            var genericTypes =
                    from m in declaringType.GetMethods()
                    where m.Name.Equals("SelectMany")
                    let paramTypes = m.GetParameters().Select(e => e.ParameterType).ToArray()
                    where paramTypes.Length == 3
                    select argTypes[1].InferTypeArgument(paramTypes[1])
                ;

            Console.WriteLine(genericTypes.Count());
        }
    }
}
