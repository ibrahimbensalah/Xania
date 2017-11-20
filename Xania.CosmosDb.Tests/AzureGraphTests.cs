using System;
using System.Linq;
using System.Security;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;

namespace Xania.CosmosDb.Tests
{
    public class AzureGraphTests
    {
        private readonly string EndpointUrl = "https://xania-sql.documents.azure.com:443/";
        private readonly SecureString PrimaryKey = "xiq9QJQ2naMaqrkbWlu5yxL8N3PTIST0dJuwjHqsei1psDvdGGWfEsGO9I0dP3HuJvXbMXjle4galX0VrcV0FA==".Secure();

        [Test]
        public void Test()
        {
            var model = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = new Person { Id = 2 }
            };

            var graph = Graph.FromObject(model);
            graph.Vertices.Count.Should().Be(2);
            graph.Vertices.Select(e => e.Label).All(e => e.Equals(nameof(Person).ToCamelCase())).Should().BeTrue();
            graph.Vertices.SelectMany(v => v.Properties).Should().Contain(e => "firstName".Equals(e.Name)).Subject.Values.Select(e => e.Item2).Cast<string>().ShouldAllBeEquivalentTo(new[] { "Ibrahim" });

            var friend = graph.Relations.Should().ContainSingle().Which;
            friend.Name.Should().Be("friend");

            friend.TargetId.Should().Be("2");

            foreach (var vertex in graph.Vertices)
                Console.WriteLine(JsonConvert.SerializeObject(vertex));
        }

        [Test]
        public void SaveModelTest()
        {
            var model = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = new Person { Id = 2 },
                Enemy = new Person { Id = 2 },
                HQ = new Address
                {
                    Id = "address1",
                    Location = "Amstelveen"
                },
                Tags = new[] { "Programmer", "Entrepeneur" },
                Friends = { new Person { Id = 4 } }
            };

            var graph = Graph.FromObject(model);

            using (var client = new Client(EndpointUrl, PrimaryKey))
            {
                Console.WriteLine("Reading all objects");
                var clone = client.GetVertexTree(1).Result.ToObjects<Person>().SingleOrDefault();
                if (clone != null)
                {
                    Console.WriteLine(JsonConvert.SerializeObject(clone));
                    client.ExecuteGremlinAsync("g.V().drop()").Wait();
                }
                client.UpsertAsync(graph).Wait();
            }
        }

        [Test]
        public void ReadModelTest()
        {
            var model = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = new Person { Id = 2 },
                Enemy = new Person { Id = 3 },
                Friends = { new Person { Id = 4 } },
                Tags = new[] { "tag1" }
            };

            var g = Graph.FromObject(model);
            g.Vertices.Count.Should().Be(4);
            g.Relations.Count.Should().Be(3);

            var clone = g.ToObjects<Person>().Single(e => e.Id == 1);

            clone.Id.Should().Be(model.Id);
            clone.FirstName.Should().Be(model.FirstName);
            clone.Friend.Should().NotBeNull();
            clone.Enemy.Should().NotBeNull();
            clone.Friend.Id.Should().Be(model.Friend.Id);
            clone.Enemy.Id.Should().Be(model.Enemy.Id);

            //clone.Friends.Length.Should().Be(1);
        }

        [Test]
        public void GraphLinqTest()
        {
            using (var client = new Client(EndpointUrl, PrimaryKey))
            {
                var persons = client.Query<Person>().Where(e => e.Id == 1);
                foreach (var i in persons)
                {
                    Console.WriteLine($"Person: {i.FirstName} [{string.Join(",", i.Tags)}]");
                }
            }
        }
    }
}
