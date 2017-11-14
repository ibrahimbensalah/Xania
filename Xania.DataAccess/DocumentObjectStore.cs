using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Bson;

namespace Xania.DataAccess
{
    public class DocumentObjectStore<TModel> : IObjectStore<TModel>
    {
        static DocumentObjectStore()
        {
            _keyProperties = KeyProperties(typeof(TModel));
        }

        private readonly IDocumentStore _documentStore;
        private readonly string DocumentFolder = typeof(TModel).FullName.ToLowerInvariant();
        private static readonly IList<PropertyDescriptor> _keyProperties;

        public DocumentObjectStore(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            foreach (var resourceId in _documentStore.List(DocumentFolder))
                yield return Deserialize(_documentStore.OpenRead(DocumentFolder, resourceId));
        }

        public Task<TModel> AddAsync(TModel model)
        {
            var resourceId = GetResourceId(model);
            Serialize(model, _documentStore.OpenWrite(DocumentFolder, resourceId));
            return Task.FromResult(model);
        }

        private TModel Deserialize(Stream stream)
        {
            using (var writer = new BsonDataReader(stream))
            {
                var serializer = new JsonSerializer();
                return serializer.Deserialize<TModel>(writer);
            }
        }

        private void Serialize(TModel model, Stream output)
        {
            using (var writer = new BsonDataWriter(output))
            {
                var serializer = new JsonSerializer();
                serializer.Serialize(writer, model);
            }
        }

        public async Task DeleteAsync(Expression<Func<TModel, bool>> condition)
        {
            var compiled = condition.Compile();

            foreach (var resourceId in _documentStore.List(DocumentFolder))
            {
                var model = Deserialize(_documentStore.OpenRead(DocumentFolder, resourceId));
                if (compiled(model))
                    await _documentStore.DeleteAsync(DocumentFolder, resourceId);
            }
        }

        public Task UpdateAsync(TModel model)
        {
            var resourceId = GetResourceId(model);
            Serialize(model, _documentStore.OpenWrite(DocumentFolder, resourceId));

            return Task.CompletedTask;
        }

        private string GetResourceId(TModel model)
        {
            var stringBuilder = new StringBuilder();

            foreach (var kp in _keyProperties)
            {
                var str = JsonConvert.SerializeObject(kp.GetValue(model));
                stringBuilder.Append(str);
            }

            return stringBuilder.ToString();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        static IList<PropertyDescriptor> KeyProperties(Type componentType)
        {
            var keyProperties = new List<PropertyDescriptor>();
            PropertyDescriptor idProperty = null;
            PropertyDescriptor modelIdProperty = null;
            foreach (PropertyDescriptor prop in TypeDescriptor.GetProperties(componentType))
            {
                var keyAttr = prop.Attributes.OfType<KeyAttribute>().FirstOrDefault();
                if (keyAttr != null)
                {
                    keyProperties.Add(prop);
                }
                if (String.Equals(prop.Name, "Id", StringComparison.OrdinalIgnoreCase))
                {
                    idProperty = prop;
                }
                if (String.Equals(prop.Name, componentType.Name + "Id", StringComparison.OrdinalIgnoreCase))
                {
                    modelIdProperty = prop;
                }
            }

            if (keyProperties.Any())
                return keyProperties;

            if (idProperty != null)
                keyProperties.Add(idProperty);
            else if (modelIdProperty != null)
                keyProperties.Add(idProperty);
            else
                throw new InvalidOperationException("Unable to resolve key properties of model type " + componentType);

            return keyProperties;
        }

        static string GetMd5Hash(MD5 md5Hash, string input)
        {

            // Convert the input string to a byte array and compute the hash.
            byte[] data = md5Hash.ComputeHash(Encoding.UTF8.GetBytes(input));

            // Create a new Stringbuilder to collect the bytes
            // and create a string.
            StringBuilder sBuilder = new StringBuilder();

            // Loop through each byte of the hashed data 
            // and format each one as a hexadecimal string.
            for (int i = 0; i < data.Length; i++)
            {
                sBuilder.Append(data[i].ToString("x2"));
            }

            // Return the hexadecimal string.
            return sBuilder.ToString();
        }
    }
}
