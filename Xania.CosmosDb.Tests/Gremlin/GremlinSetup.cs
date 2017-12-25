using System;
using NUnit.Framework;
using Xania.Graphs;

namespace Xania.CosmosDb.Tests.Gremlin
{
    [SetUpFixture]
    public class GremlinSetup
    {
        public static CosmosDbClient CosmosDbClient { get; private set; }

        [OneTimeSetUp]
        public static void CreateClient()
        {
            var endpointUrl = "https://localhost:8081/";
            var primaryKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
                .Secure();

            CosmosDbClient = new CosmosDbClient(endpointUrl, primaryKey, "ToDoList", "Items");
            CosmosDbClient.Log += Console.WriteLine;

            // SetUpData();
        }

        private static void SetUpData()
        {
            var friend = new Person {Id = 2};
            var ibrahim = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = friend,
                Enemy = new Person {Id = 3, Friends = {friend}},
                HQ = new Address
                {
                    Id = "address1",
                    Location = "Amstelveen"
                },
                Tags = new[] {"Programmer", "Entrepeneur"},
                Friends = {friend}
            };
            friend.Friends.Add(new Person {Id = 4});

            CosmosDbClient.ExecuteGremlinAsync("g.V().drop()").Wait();
            CosmosDbClient.UpsertAsync(Graph.FromObject(ibrahim)).Wait();
        }

        [OneTimeTearDown]
        public static void DisposeClient()
        {
            CosmosDbClient.Dispose();
        }
    }
}
