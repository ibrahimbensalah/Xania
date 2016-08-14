using System;
using System.Collections;
using System.Collections.Generic;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;

namespace Xania.DataAccess
{
    public class BsonRepository<TModel>: IEnumerable<TModel>
    {
        private readonly IDocumentStore _documentStore;

        public BsonRepository(IDocumentStore documentStore)
        {
            _documentStore = documentStore;
        }

        public virtual void Add(TModel model)
        {
            var resourceId = Guid.NewGuid().ToString();
            _documentStore.Add(typeof(TModel).Name, resourceId, stream =>
            {
                using (var bsonWriter = new BsonBinaryWriter(stream))
                {
                    BsonSerializer.Serialize(bsonWriter, typeof(TModel), model, e => {});
                }
            });
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            foreach (var id in _documentStore.List(typeof(TModel).Name))
            {
                yield return _documentStore.Read(typeof(TModel).Name, id, stream =>
                {
                    using (var bsonReader = new BsonBinaryReader(stream))
                    {
                        return BsonSerializer.Deserialize<TModel>(bsonReader);
                    }
                });
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
