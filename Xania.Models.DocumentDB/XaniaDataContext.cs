using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using System.Net;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Xania.DataAccess;
using Xania.Models;

namespace Xania.Data.DocumentDB
{
    public class AzureDocumentStore<T> : IObjectStore<T>
    {
        private readonly DocumentClient client;

        public AzureDocumentStore(DocumentClient client)
        {
            this.client = client;
        }

        public IEnumerator<T> GetEnumerator()
        {
            var collectionUri = UriFactory.CreateDocumentCollectionUri(nameof(XaniaDataContext), $"{typeof(T).Name}Collection");
            return client.CreateDocumentQuery<T>(collectionUri).GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Task<T> AddAsync(T model)
        {
            throw new NotImplementedException();
        }

        public Task DeleteAsync(Expression<Func<T, bool>> condition)
        {
            throw new NotImplementedException();
        }

        public Task UpdateAsync(Expression<Func<T, bool>> condition, T user)
        {
            throw new NotImplementedException();
        }
    }

    public class XaniaDataContext : IDisposable
    {
        private const string EndpointUrl = "https://xania-sql.documents.azure.com:443/";
        private const string PrimaryKey = "xiq9QJQ2naMaqrkbWlu5yxL8N3PTIST0dJuwjHqsei1psDvdGGWfEsGO9I0dP3HuJvXbMXjle4galX0VrcV0FA==";
        private DocumentClient client;

        public AzureDocumentStore<T> Store<T>()
        {
            return new AzureDocumentStore<T>(new DocumentClient(new Uri(EndpointUrl), PrimaryKey));
        }

        private async Task<AzureDocumentStore<Invoice>> GetStartedDemo()
        {
            client = new DocumentClient(new Uri(EndpointUrl), PrimaryKey);
            await client.CreateDatabaseIfNotExistsAsync(new Database { Id = nameof(XaniaDataContext) });

            await this.client.CreateDocumentCollectionIfNotExistsAsync(
                UriFactory.CreateDatabaseUri(nameof(XaniaDataContext)),
                new DocumentCollection { Id = "InvoiceCollection" }
            );

            var resourceId = await CreateDocument(nameof(XaniaDataContext), "InvoiceCollection", new Invoice { });
            await DeleteDocument(nameof(XaniaDataContext), "InvoiceCollection", resourceId);

            return new AzureDocumentStore<Invoice>(client);
        }

        private async Task DeleteDocument(string databaseName, string collectionName, string resourceId)
        {
            var documentUri = UriFactory.CreateDocumentUri(databaseName, collectionName, resourceId);
            var response = await this.client.DeleteDocumentAsync(documentUri);
        }

        private async Task<string> CreateDocument(string databaseName, string collectionName, Invoice content)
        {
            // var documentUri = UriFactory.CreateDocumentUri(databaseName, collectionName, content.Id.ToString("N"));
            content.Id = Guid.NewGuid();
            Console.WriteLine(content.Id);
            var collectionUri = UriFactory.CreateDocumentCollectionUri(databaseName, collectionName);
            var response = await this.client.UpsertDocumentAsync(collectionUri, content);
            Console.WriteLine("Response Id {0}", response.Resource.Id);
            return response.Resource.Id;
        }

        public void Main()
        {
            try
            {
                GetStartedDemo().Wait();
            }
            catch (DocumentClientException de)
            {
                Exception baseException = de.GetBaseException();
                Console.WriteLine("{0} error occurred: {1}, Message: {2}", de.StatusCode, de.Message, baseException.Message);
            }
            catch (Exception e)
            {
                Exception baseException = e.GetBaseException();
                Console.WriteLine("Error: {0}, Message: {1}", e.Message, baseException.Message);
            }
            finally
            {
                Console.WriteLine("End of demo, press any key to exit.");
            }
        }

        void IDisposable.Dispose()
        {
        }
    }

}
