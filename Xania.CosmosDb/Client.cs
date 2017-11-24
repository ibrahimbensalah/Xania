using Microsoft.Azure.Graphs;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;

namespace Xania.CosmosDb
{
    public class Client: IDisposable
    {
        public readonly DocumentClient _client;
        public readonly DocumentCollection _collection;

        public Client(string endpointUrl, SecureString primaryKey)
        {
            var connectionPolicy = new ConnectionPolicy { ConnectionMode = ConnectionMode.Direct, ConnectionProtocol = Protocol.Tcp };
            var settings = new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                Converters = { new VertexConverter() }
            };
            _client = new DocumentClient(new Uri(endpointUrl), primaryKey, settings, connectionPolicy);
            _collection = _client.CreateDocumentCollectionIfNotExistsAsync(
                UriFactory.CreateDatabaseUri("XaniaDataContext"),
                new DocumentCollection { Id = "Items" },
                new RequestOptions { OfferThroughput = 1 }).Result.Resource;
        }

        public async Task<Graph> GetVertexTree(object vertexId)
        {
            var gremlin = $"g.V('{vertexId}').optional(outE()).tree()";
            var graph = new Graph();
            foreach (var result in await ExecuteGremlinAsync(gremlin))
            {
                foreach (var verticesJson in result.Properties().Select(x => x.Value).OfType<JObject>())
                {
                    var vertexJson = verticesJson.Value<JObject>("key");
                    var relationsJson = verticesJson.Value<JObject>("value");
                    var vertex = new Vertex(vertexJson.Value<string>("label"))
                    {
                        Id = vertexJson.Value<string>("id")
                    };
                    graph.Vertices.Add(vertex);

                    var propertiesJson = vertexJson.Value<JObject>("properties");
                    if (propertiesJson != null)
                    {
                        foreach (var prop in propertiesJson.Properties())
                        {
                            var propValue = ((JArray)prop.Value).Select(x =>
                                new Tuple<string, object>(x.Value<string>("id"), x.Value<Object>("value"))).ToArray();

                            var graphProp = new Property(prop.Name, propValue);
                            vertex.Properties.Add(graphProp);
                        }
                    }

                    foreach (var relationJson in relationsJson.Properties().Select(x => x.Value.Value<JObject>("key")))
                    {
                        var id = relationJson.Value<string>("id");
                        var label = relationJson.Value<string>("label");
                        var targetId = relationJson.Value<string>("inV");
                        var sourceId = relationJson.Value<string>("outV");

                        var relation = new Relation(sourceId, label, targetId)
                        {
                            Id = id
                        };
                        graph.Relations.Add(relation);
                    }
                }
            }
            return graph;
        }

        public async Task<IEnumerable<JObject>> ExecuteGremlinAsync(string gremlin)
        {
            Console.WriteLine($"Running {gremlin}");

            var query = _client.CreateGremlinQuery(_collection, gremlin);
            var list = new List<JObject>();
            while (query.HasMoreResults)
            {
                var result = await query.ExecuteNextAsync<JObject>();
                foreach(var e in result)
                    list.Add(e);
            }
            return list;
        }

        public void Dispose()
        {
            _client.Dispose();
        }

        public Task UpsertDocumentAsync(Vertex vertex)
        {
            return _client.UpsertDocumentAsync(_collection.DocumentsLink, vertex, new RequestOptions());
        }

        public async Task UpsertAsync(Graph graph)
        {
            foreach (var vertex in graph.Vertices)
                await UpsertDocumentAsync(vertex);
            foreach (var relation in graph.Relations)
            {
                var sourceId = relation.SourceId;
                var targetId = relation.TargetId;
                var rel = relation.Name.ToCamelCase();

                await ExecuteGremlinAsync($"g.V('{sourceId}').where(outE('{rel}').inV().has('id', '{targetId}').count().is(0)).addE('{rel}').to(g.V('{targetId}'))");
            }
        }

        public Task UpsertAsync(object model)
        {
            return UpsertAsync(Graph.FromObject(model));
        }

        public GraphQueryable<TModel> Query<TModel>()
        {
            return new GraphQueryable<TModel>(this);
        }
    }
}