using System;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using Xania.CosmosDb.Tests.Gremlin;
using Xania.Data.DocumentDB;
using Xania.Graphs;
using Xania.Models;

namespace Xania.CosmosDb.Tests.Graphs
{
    public class GraphMappingTests
    {
        [Test]
        public void JObjectToEnumerable()
        {
            var obj = JObject.FromObject(new
            {
                Id = 1,
                Friends = new Person { Id = 2 }
            });

            var person = CosmosDbClient.ConvertToObject(obj, typeof(Person))
                .Should().BeOfType<Person>().Subject;

            person.Id.Should().Be(1);
            person.Friends.Should().ContainSingle().Which.Id.Should().Be(2);
        }

        [Test]
        public void MapFromObject()
        {
            var portalDbClient = GremlinSetup.CreateClient("Portal", false);

            portalDbClient.ExecuteGremlinAsync("g.V().drop()").Wait();

            foreach (var company in GetCompanies())
            {
                var g = Graph.FromObject(company);
                portalDbClient.UpsertAsync(g).Wait();
                break;
            }
            // g.V().hasLabel('company').as('c').out('address').out('lines').as('l').order().by(select('Name'), decr).project('id', 'name', 'fullName', 'location', 'addressType', 'addressLine').by(coalesce(select('c').id(), constant())).by(coalesce(select('c').values('name'), constant())).by(coalesce(select('c').out('address').values('fullName'), constant())).by(coalesce(select('c').out('address').values('location'), constant())).by(coalesce(select('l').values('type'), constant())).by(coalesce(select('l').values('value'), constant()))
            Console.WriteLine("=====================================================");

            portalDbClient.Log += Console.WriteLine;

            var queryable =
                from c in portalDbClient.Set<Company>().OrderByDescending(e => e.Name)
                from l in c.Address.Lines
                select new
                {
                    c.Id,
                    c.Name,
                    c.Address.FullName,
                    c.Address.Location,
                    AddressType = l.Type,
                    AddressLine = l.Value
                };

            var result = queryable.ToArray().First();
            result.Name.Should().Be("Xania Software");
            result.FullName.Should().Be("Ibrahim ben Salah");
            result.Location.Should().Be("Amsterdam");
            result.AddressType.Should().Be(AddressType.Street);
            result.AddressLine.Should().Be("Punter 315 ");
        }

        private static AzureObjectStore<Company> GetCompanies()
        {
            var config = new ConfigurationBuilder().AddUserSecrets<GraphMappingTests>().Build();
            var dataContext = new XaniaDataContext(config["xaniadb-endpointUrl"], config["xaniadb-primarykey"]);
            return dataContext.Store<Company>();
        }
    }
}
