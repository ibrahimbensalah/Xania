using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using Xania.Graphs.Linq;
using Xania.Models;
using Xania.Reflection;

namespace Xania.Graphs.Runtime.Tests
{
    public class RuntimeTests
    {
        static readonly Company xania = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Xania Software",
            Address = new Address
            {
                FullName = "Ibrahim ben Salah",
                Location = "Amstelveen",
                Lines =
                {
                    new AddressLine { Type = AddressType.Street, Value = "Punter 315" }
                }
            }
        };

        private readonly InMemoryGraphDbContext db = new InMemoryGraphDbContext(xania);

        [Test]
        public void QueryCompanyTest()
        {
            var companies = db.Set<Company>();
            var company = companies.ToArray().Should().ContainSingle().Subject;

            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }
    }

    public class InMemoryGraphDbContext : IGraphDataContext
    {
        private readonly Graph _graph;

        public InMemoryGraphDbContext(object model) : this(Graph.FromObject(model))
        {
        }

        public InMemoryGraphDbContext(Graph graph)
        {
            _graph = graph;
        }

        public Task<IEnumerable<object>> ExecuteAsync(GraphTraversal traversal, Type elementType)
        {
            var graph = _graph;
            var vertices = graph.Vertices.OfType<Vertex>();

            foreach (var step in traversal.Steps)
            {
                if (step is V V)
                    vertices = vertices.Where(vertex => vertex.Label.Equals(V.Label, StringComparison.InvariantCultureIgnoreCase));
                else
                    throw new NotImplementedException($"Execute {step.GetType()}");
            }

            //foreach (var step in traversal.Steps)
            //{
            //    if (step is V V)
            //    {
            //        var vertices = _graph.Vertices.Where(vertex => vertex.Label.Equals(V.Label));
            //        var adjancyList = vertices.ToDictionary(e => e, e => _graph.Edges.Where(edge => edge.OutV.Equals(e.Id)));
            //    }

            //    throw new NotImplementedException($"Execute {step.GetType()}");
            //}


            var result = 
                vertices.Select(v => CreateInstance(v, elementType));
            
            return Task.FromResult(result);
        }

        private object CreateInstance(Vertex v, Type elementType)
        {
            var valueFactories = v.Properties
                .ToDictionary<Property, string, Func<Type, object>>(
                    e => e.Name,
                    e => t => e.Value.Convert(t),
                    StringComparer.InvariantCultureIgnoreCase
                );
            valueFactories.Add("id", v.Id.Convert);
            return elementType.CreateInstance(valueFactories);
        }
    }
}
