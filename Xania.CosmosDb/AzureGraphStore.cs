using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.Azure.Documents.Client;
using Newtonsoft.Json;
using Xania.DataAccess;

namespace Xania.CosmosDb
{
    public class AzureGraphStore<T> : IObjectStore<T>
    {
        private readonly Client client;
        public AzureGraphStore(Client client)
        {
            this.client = client;
        }

        public IEnumerator<T> GetEnumerator()
        {
            return Query().GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public async Task<T> AddAsync(T model)
        {
            await client.UpsertAsync(model);
            return model;
        }

        public Task UpdateAsync(T model)
        {
            return client.UpsertAsync(model);
        }

        public Task DeleteAsync(Expression<Func<T, bool>> condition)
        {
            return client.ExecuteGremlinAsync("g.V().drop()");
            //var conditionFunc = condition.Compile();
            //foreach (var resource in client.CreateDocumentQuery<Document>(DocumentCollectionUri))
            //{
            //    var documentUri = UriFactory.CreateDocumentUri(_databaseId, _collectionId, resource.Id);
            //    var doc = await client.ReadDocumentAsync<T>(documentUri);
            //    if (conditionFunc(doc))
            //        await client.DeleteDocumentAsync(documentUri);
            //}
        }

        public IQueryable<T> Query()
        {
            return client.Query<T>();
        }

        private class Document
        {
            [JsonProperty("id")]
            public string Id { get; set; }
        }

    }
}
