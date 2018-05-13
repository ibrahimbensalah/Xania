using System.Collections.Generic;
using NUnit.Framework;
using Xania.Graphs;

namespace Xania.CosmosDb.Tests.Gremlin
{
    [SetUpFixture]
    public class GremlinSetup
    {
        private static readonly IDictionary<string, CosmosDbClient> clients = new Dictionary<string, CosmosDbClient>();

        public static CosmosDbClient CreateClient(string collectionId, bool seed = true )
        {
            if (clients.TryGetValue(collectionId, out var cosmosDbClient))
                return cosmosDbClient;

            var endpointUrl = "https://localhost:8081/";
            var primaryKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
                .Secure();

            cosmosDbClient = new CosmosDbClient(endpointUrl, primaryKey, "ToDoList", collectionId);

            if (seed)
                SetUpData(cosmosDbClient);

            clients.Add(collectionId, cosmosDbClient);
            return cosmosDbClient;
        }

        public static void SetUpData(CosmosDbClient client)
        {
            client.ExecuteGremlinAsync("g.V().drop()").Wait();

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
            friend.Friends.Add(new Person {Id = 4, Friend = new Person {Id = 5}});

            client.UpsertAsync(Graph.FromObject(ibrahim)).Wait();
        }

        [OneTimeTearDown]
        public static void DisposeClients()
        {
            foreach(var client in clients.Values)
                client.Dispose();
        }
    }
}
