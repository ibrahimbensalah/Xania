using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.Azure.Documents.Client;
using Newtonsoft.Json;
using Xania.DataAccess;

namespace Xania.Data.DocumentDB
{
    public class AzureObjectStore<T> : IObjectStore<T>
    {
        private readonly DocumentClient client;

        public AzureObjectStore(DocumentClient client)
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
            var collectionUri = UriFactory.CreateDocumentCollectionUri(nameof(XaniaDataContext), $"{typeof(T).Name}Collection");
            var response = await client.UpsertDocumentAsync(collectionUri, model, new RequestOptions());
            return model;
        }

        public async Task UpdateAsync(T model)
        {
            var collectionUri = UriFactory.CreateDocumentCollectionUri(nameof(XaniaDataContext), $"{typeof(T).Name}Collection");
            await client.UpsertDocumentAsync(collectionUri, model, new RequestOptions());
        }

        public async Task DeleteAsync(Expression<Func<T, bool>> condition)
        {
            var collectionUri = UriFactory.CreateDocumentCollectionUri(nameof(XaniaDataContext), $"{typeof(T).Name}Collection");
            foreach (var resource in client.CreateDocumentQuery<dynamic>(collectionUri))
            {
                var documentUri = UriFactory.CreateDocumentUri(nameof(XaniaDataContext), $"{typeof(T).Name}Collection", resource.id);
                await client.DeleteDocumentAsync(documentUri);
            }
        }

        public IQueryable<T> Query()
        {
            var collectionUri = UriFactory.CreateDocumentCollectionUri(nameof(XaniaDataContext), $"{typeof(T).Name}Collection");
            return client.CreateDocumentQuery<T>(collectionUri);
        }

        private class Document
        {
            [JsonProperty("id")]
            public string Id { get; set; }
        }

    }
}