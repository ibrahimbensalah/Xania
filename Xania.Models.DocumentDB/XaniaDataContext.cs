using System;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Xania.Data.DocumentDB
{
    public class XaniaDataContext : IDisposable
    {
        public XaniaDataContext(string endpointUrl, string primaryKey)
        {
            var connectionPolicy = new ConnectionPolicy {ConnectionMode = ConnectionMode.Direct, ConnectionProtocol = Protocol.Tcp};
            var settings = new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            };

            Client = new Lazy<DocumentClient>(() =>
                new DocumentClient(new Uri(endpointUrl), primaryKey, settings, connectionPolicy));
        }

        public Lazy<DocumentClient> Client { get; set; }

        public AzureObjectStore<T> Store<T>()
        {
            this.Client.Value.CreateDocumentCollectionIfNotExistsAsync(UriFactory.CreateDatabaseUri(nameof(XaniaDataContext)),
                new DocumentCollection { Id = $"{typeof(T).Name}Collection" }).Wait();

            return new AzureObjectStore<T>(nameof(XaniaDataContext), $"{typeof(T).Name}Collection", this.Client.Value);
        }

        //public void Main()
        //{
        //    try
        //    {
        //    }
        //    catch (DocumentClientException de)
        //    {
        //        Exception baseException = de.GetBaseException();
        //        Console.WriteLine("{0} error occurred: {1}, Message: {2}", de.StatusCode, de.Message, baseException.Message);
        //    }
        //    catch (Exception e)
        //    {
        //        Exception baseException = e.GetBaseException();
        //        Console.WriteLine("Error: {0}, Message: {1}", e.Message, baseException.Message);
        //    }
        //    finally
        //    {
        //        Console.WriteLine("End of demo, press any key to exit.");
        //    }
        //}

        void IDisposable.Dispose()
        {
            if (this.Client.IsValueCreated)
                this.Client.Value.Dispose();
        }
    }
}
