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

        private static AzureObjectStore<Company> GetCompanies()
        {
            var config = new ConfigurationBuilder().AddUserSecrets<GraphMappingTests>().Build();
            var dataContext = new XaniaDataContext(config["xaniadb-endpointUrl"], config["xaniadb-primarykey"]);
            return dataContext.Store<Company>();
        }
    }
}
