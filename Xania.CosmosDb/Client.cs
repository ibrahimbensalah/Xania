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
using System.Collections;

namespace Xania.CosmosDb
{
    public class Client: IDisposable
    {
        public readonly DocumentClient _client;
        public readonly DocumentCollection _collection;

        public Client(string endpointUrl, SecureString primaryKey, string databaseId, string collectionId)
        {
            var connectionPolicy = new ConnectionPolicy
            {
                ConnectionMode = ConnectionMode.Gateway,
                ConnectionProtocol = Protocol.Tcp
            };
            var settings = new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                Converters = { new VertexConverter() }
            };
            _client = new DocumentClient(new Uri(endpointUrl), primaryKey, settings, connectionPolicy);
            
            // _client.OpenAsync().Wait();
            // CreateDatabaseIfNotExistsAsync(databaseId).Wait();

            _collection = _client.CreateDocumentCollectionIfNotExistsAsync(
                UriFactory.CreateDatabaseUri(databaseId),
                new DocumentCollection { Id = collectionId },
                new RequestOptions { OfferThroughput = 10000 }).Result.Resource;
        }

        public event Action<string> Log;

        public Task<Graph> GetVertexGraph(object vertexId)
        {
            return GetVertexGraph($"g.V('{vertexId}').union(identity(), outE())");
        }

        public async Task<Graph> GetVertexGraph(string vertexQuery)
        {
            var graph = new Graph();
            foreach (var result in (await ExecuteGremlinAsync(vertexQuery)).OfType<JObject>())
            {
                var type = result.Value<string>("type");
                if (string.Equals(type, "vertex"))
                {
                    var vertexJson = result;
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
                }
                else if (string.Equals(type, "edge"))
                {
                    var relationJson = result;
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
                else
                {
                    graph.Anonymous.Add(result);
                }
            }

            return graph;
        }

        public async Task<IEnumerable<JToken>> ExecuteGremlinAsync(string gremlin)
        {
            Log?.Invoke($"Running {gremlin}");

            var list = new List<JToken>();
            var feedOptions = new FeedOptions
            {
                MaxDegreeOfParallelism = 10,
                MaxBufferedItemCount = 100,
                MaxItemCount = 100,
                EnableCrossPartitionQuery = true
            };
            using (var query = _client.CreateGremlinQuery(_collection, gremlin, feedOptions))
            {
                while (query.HasMoreResults)
                {
                    var result = await query.ExecuteNextAsync();
                    Log?.Invoke($"Result [{result.Count} Items]\r\n{string.Join(",\r\n", result)}");

                    foreach (var e in result)
                        list.Add(e);
                }
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
            return new GraphQueryable<TModel>(new GraphQueryProvider(this));
        }

        private async Task CreateDatabaseIfNotExistsAsync(string DatabaseId)
        {
            try
            {
                await _client.ReadDatabaseAsync(UriFactory.CreateDatabaseUri(DatabaseId));
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    await _client.CreateDatabaseAsync(new Database { Id = DatabaseId });
                }
                else
                {
                    throw;
                }
            }
        }

        private async Task CreateCollectionIfNotExistsAsync(string DatabaseId, string CollectionId)
        {
            try
            {
                await _client.ReadDocumentCollectionAsync(UriFactory.CreateDocumentCollectionUri(DatabaseId, CollectionId));
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    await _client.CreateDocumentCollectionAsync(
                        UriFactory.CreateDatabaseUri(DatabaseId),
                        new DocumentCollection { Id = CollectionId },
                        new RequestOptions { OfferThroughput = 1000 });
                }
                else
                {
                    throw;
                }
            }
        }
    }
}