using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Bson;

namespace Xania.DataAccess
{
    public class DocumentObjectStore<TModel> : IObjectStore<TModel>
    {
        private readonly IDocumentStore _documentStore;
        private readonly string DocumentFolder = typeof(TModel).FullName.ToLowerInvariant();

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
            var resourceId = Guid.NewGuid().ToString("N").ToLowerInvariant();
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

        public Task UpdateAsync(Expression<Func<TModel, bool>> condition, TModel user)
        {
            var compiled = condition.Compile();

            foreach (var resourceId in _documentStore.List(DocumentFolder))
            {
                var model = Deserialize(_documentStore.OpenRead(DocumentFolder, resourceId));
                if (compiled(model))
                {
                    Serialize(user, _documentStore.OpenWrite(DocumentFolder, resourceId));
                }
            }

            return Task.CompletedTask;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Type ElementType { get; } = typeof(TModel);
        public Expression Expression { get; }
        public IQueryProvider Provider { get; }
    }
}
