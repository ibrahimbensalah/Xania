using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;

namespace Xania.DataAccess
{
    public class BsonObjectStore<TModel> : IObjectStore<TModel>
    {
        private readonly IDocumentStore _documentStore;
        private readonly string _baseFolder;

        public BsonObjectStore(IDocumentStore documentStore, string baseFolder)
        {
            _documentStore = documentStore;
            _baseFolder = baseFolder;
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            foreach (var resourceId in _documentStore.List(_baseFolder))
                yield return _documentStore.Read(_baseFolder, resourceId, Deserialize);
        }

        private TModel Deserialize(Stream stream)
        {
            using (var bsonReader = new BsonBinaryReader(stream))
            {
                return BsonSerializer.Deserialize<TModel>(bsonReader);
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public void Add(TModel model)
        {
            var resourceId = string.Join("-", model.Keys().Select(k => k.ToString()));
            _documentStore.Add(typeof(TModel).Name, resourceId, stream =>
            {
                using (var bsonWriter = new BsonBinaryWriter(stream))
                {
                    BsonSerializer.Serialize(bsonWriter, typeof(TModel), model, e => { });
                }
            });
        }

        public void Delete(TModel model)
        {
            throw new NotImplementedException();
        }
    }
}