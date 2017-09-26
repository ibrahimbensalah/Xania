using System;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Xania.Models;

namespace Xania.Data.DocumentDB
{
    public class XaniaDataContext : IDisposable
    {
        private const string EndpointUrl = "https://xania-sql.documents.azure.com:443/";
        private const string PrimaryKey = "xiq9QJQ2naMaqrkbWlu5yxL8N3PTIST0dJuwjHqsei1psDvdGGWfEsGO9I0dP3HuJvXbMXjle4galX0VrcV0FA==";

        public XaniaDataContext()
        {
            this.Client = new Lazy<DocumentClient>(() => new DocumentClient(new Uri(EndpointUrl), PrimaryKey,
                new JsonSerializerSettings
                {
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                }));
        }

        public Lazy<DocumentClient> Client { get; set; }

        public AzureObjectStore<T> Store<T>()
        {
            return new AzureObjectStore<T>(this.Client.Value);
        }

        public void Main()
        {
            try
            {
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
            if (this.Client.IsValueCreated)
                this.Client.Value.Dispose();
        }
    }
}
