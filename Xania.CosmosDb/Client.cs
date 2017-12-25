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
using Xania.Graphs;
using Xania.Reflection;
using GraphTraversal = Xania.Graphs.GraphTraversal;

namespace Xania.CosmosDb
{
    public class Client : IDisposable, IGraphDataContext
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

        public async Task<IList<object>> GetVertexGraph(string vertexQuery, Type objectType)
        {
            var list = new List<object>();
            foreach (var result in (await ExecuteGremlinAsync(vertexQuery)).OfType<JObject>())
            {
                list.Add(ConvertToObject(result, objectType));
            }
            return list;
        }

        public static object ConvertToObject(JToken token, Type objectType)
        {
            if (objectType.IsEnumerable() && token.Type != JTokenType.Array)
            {
                var elementType = objectType.GetItemType();
                var obj = ConvertToObject(token, elementType);

                object[] items = { obj };

                if (objectType.IsArray)
                    return objectType.CreateArray(items);

                return objectType.CreateCollection(items);
            }
            if (token.Type == JTokenType.Object)
            {
                var vertexJson = (JObject)token;
                var type = vertexJson.Value<string>("type");
                //if (string.Equals(type, "edge"))
                //{
                //    var relationJson = vertexJson;
                //    var id = relationJson.Value<string>("id");
                //    var label = relationJson.Value<string>("label");
                //    var targetId = relationJson.Value<string>("inV");
                //    var sourceId = relationJson.Value<string>("outV");

                //    var relation = new Relation(sourceId, label, targetId)
                //    {
                //        Id = id
                //    };
                //    return relation;
                //}

                if (string.Equals(type, "vertex"))
                {
                    string label = vertexJson.Value<string>("label");

                    if (!objectType.Name.Equals(label, StringComparison.InvariantCultureIgnoreCase))
                    {
                        throw new InvalidOperationException("Mapping mismatch type <> label");
                    }

                    var properties = vertexJson.Value<JObject>("properties");
                    var valueFactories =
                        properties?
                            .Properties()
                            .ToDictionary<JProperty, string, Func<Type, object>>(
                                e => e.Name,
                                e => t => MultiValueToObject(e.Value.Select(v => v["value"]).ToArray(),
                                    t),
                                StringComparer.InvariantCultureIgnoreCase
                            ) ?? new Dictionary<string, Func<Type, object>>(StringComparer
                            .InvariantCultureIgnoreCase);

                    if (vertexJson.TryGetValue("id", out var id))
                    {
                        valueFactories.Add("id", t => id.ToObject(t));
                    }

                    return objectType.CreateInstance(valueFactories);
                }

                {
                    var valueFactories =
                        vertexJson
                            .Properties()
                            .ToDictionary<JProperty, string, Func<Type, object>>(
                                e => e.Name,
                                e => t => ConvertToObject(e.Value, t),
                                StringComparer.InvariantCultureIgnoreCase
                            );
                    return objectType.CreateInstance(valueFactories);
                }
            }
            return token.ToObject(objectType);
        }

        private static object MultiValueToObject(JToken[] values, Type objectType)
        {
            if (objectType.IsEnumerable())
            {
                var elementType = objectType.GetElementType();
                var items = values.Select(e => ConvertToObject(e, elementType)).ToArray();
                return objectType.CreateCollection(items);
            }

            return values.Select(e => ConvertToObject(e, objectType)).SingleOrDefault();
        }

        public async Task<IEnumerable<Object>> ExecuteGremlinAsync(GraphTraversal traversal, Type elementType)
        {
            var gremlin = $"g.V().{traversal}.{traversal.Selector}";

            return (await ExecuteGremlinAsync(gremlin)).OfType<JObject>()
                .Select(e => ConvertToObject(e, elementType));
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
                EnableCrossPartitionQuery = false
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