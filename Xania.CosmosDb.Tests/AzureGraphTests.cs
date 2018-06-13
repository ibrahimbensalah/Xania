using System;
using System.Linq;
using FluentAssertions;
using Newtonsoft.Json;
using NUnit.Framework;
using Xania.Graphs;
using Xania.Graphs.Elements;

namespace Xania.CosmosDb.Tests
{
    public class AzureGraphTests
    {
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
            graph.Vertices.Count().Should().Be(2);
            graph.Vertices.Select(e => e.Label).All(e => e.Equals(nameof(Person).ToCamelCase())).Should().BeTrue();
            var subject = graph.Vertices.SelectMany(v => v.Properties).Should().Contain(e => "firstName".Equals(e.Name)).Subject;
            subject.Value.Should().BeOfType<GraphPrimitive>().Subject.Value.Should().Be("Ibrahim");

            var friend = graph.Edges.Should().ContainSingle().Which;
            friend.Label.Should().Be("friend");

            friend.InV.Should().Be("2");

            foreach (var vertex in graph.Vertices)
                Console.WriteLine(JsonConvert.SerializeObject(vertex));
        }

        [Test]
        public void SaveModelTest()
        {
            var friend = new Person { Id = 2 };
            var model = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = friend,
                Enemy = new Person { Id = 3, Friends = { friend } },
                HQ = new Address
                {
                    Id = "address1",
                    Location = "Amstelveen"
                },
                Tags = new[] { "Programmer", "Entrepeneur" },
                Friends = { friend }
            };

            var endpointUrl = "https://localhost:8081/";
            var primaryKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
                .Secure();

            using (var client = new CosmosDbClient(endpointUrl, primaryKey, "ToDoList", "Items"))
            {
                client.ExecuteGremlinAsync("g.V().drop()").Wait();
                client.UpsertAsync(model).Wait();

                client.Log += Console.WriteLine;

                var clone = (
                    from p in client.Set<Person>()
                    where p.Id == 1
                    select new { p.Enemy, p.Friend, p.Friends }
                ).ToArray().Single();

                if (clone != null)
                {
                    Console.WriteLine(JsonConvert.SerializeObject(clone));

                    clone.Enemy.Should().NotBeNull();
                    clone.Friend.Should().NotBeNull();
                    clone.Friends.Should().HaveCount(1);
                }
            }
        }

        //[Test]
        //public void ReadModelTest()
        //{
        //    var model = new Person
        //    {
        //        Id = 1,
        //        FirstName = "Ibrahim",
        //        Friend = new Person { Id = 2 },
        //        Enemy = new Person { Id = 3 },
        //        Friends = { new Person { Id = 4 } },
        //        Tags = new[] { "tag1" }
        //    };

        //    var g = Graph.FromObject(model);
        //    g.Vertices.Count().Should().Be(4);
        //    g.Edges.Count().Should().Be(3);

        //    var clone = g.ToObjects<Person>().Single(e => e.Id == 1);

        //    clone.Id.Should().Be(model.Id);
        //    clone.FirstName.Should().Be(model.FirstName);
        //    clone.Friend.Should().NotBeNull();
        //    clone.Enemy.Should().NotBeNull();
        //    clone.Friend.Id.Should().Be(model.Friend.Id);
        //    clone.Enemy.Id.Should().Be(model.Enemy.Id);

        //    //clone.Friends.Length.Should().Be(1);
        //}
    }
}
