using System;
using System.Threading.Tasks;
using System.Net;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;

namespace Xania.Data.DocumentDB
{
    public class XaniaDataContext : IDisposable
    {
        private const string EndpointUrl = "https://xania-sql.documents.azure.com:443/";
        private const string PrimaryKey = "xiq9QJQ2naMaqrkbWlu5yxL8N3PTIST0dJuwjHqsei1psDvdGGWfEsGO9I0dP3HuJvXbMXjle4galX0VrcV0FA==";
        private DocumentClient client;

        private async Task GetStartedDemo()
        {
            client = new DocumentClient(new Uri(EndpointUrl), PrimaryKey);
            await client.CreateDatabaseIfNotExistsAsync(new Database { Id = nameof(XaniaDataContext) });

            await this.client.CreateDocumentCollectionIfNotExistsAsync(
                UriFactory.CreateDatabaseUri(nameof(XaniaDataContext)),
                new DocumentCollection {Id = "InvoiceCollection"}
            );
        }

        private async Task CreateFamilyDocumentIfNotExists<T>(string databaseName, string collectionName, T content)
        {
            try
            {
                await this.client.ReadDocumentAsync(UriFactory.CreateDocumentUri(databaseName, collectionName, "test-document" ));
            }
            catch (DocumentClientException de)
            {
                if (de.StatusCode == HttpStatusCode.NotFound)
                {
                    await this.client.CreateDocumentAsync(UriFactory.CreateDocumentCollectionUri(databaseName, collectionName), content);
                }
                else
                {
                    throw;
                }
            }
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
