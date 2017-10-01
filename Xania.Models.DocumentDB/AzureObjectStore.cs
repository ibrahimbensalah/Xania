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
        private readonly string _databaseId;
        private readonly string _collectionId;
        private readonly DocumentClient client;
        public Uri DocumentCollectionUri => UriFactory.CreateDocumentCollectionUri(_databaseId, _collectionId);

        public AzureObjectStore(string databaseId, string collectionId, DocumentClient client)
        {
            _databaseId = databaseId;
            _collectionId = collectionId;

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
            var response = await client.UpsertDocumentAsync(DocumentCollectionUri, model, new RequestOptions());
            return model;
        }

        public async Task UpdateAsync(T model)
        {
            await client.UpsertDocumentAsync(DocumentCollectionUri, model, new RequestOptions());
        }

        public async Task DeleteAsync(Expression<Func<T, bool>> condition)
        {
            foreach (var resource in client.CreateDocumentQuery<dynamic>(DocumentCollectionUri))
            {
                var documentUri = UriFactory.CreateDocumentUri(_databaseId, _collectionId, resource.id);
                await client.DeleteDocumentAsync(documentUri);
            }
        }

        public IQueryable<T> Query()
        {
            return client.CreateDocumentQuery<T>(DocumentCollectionUri);
        }

        private class Document
        {
            [JsonProperty("id")]
            public string Id { get; set; }
        }

    }
}