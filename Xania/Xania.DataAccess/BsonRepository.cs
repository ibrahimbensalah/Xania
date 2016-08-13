using System;
using System.Collections;
using System.Collections.Generic;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;

namespace Xania.DataAccess
{
    public class BsonRepository<TModel>: IEnumerable<TModel>
    {
        private readonly IStreamRepository _streamRepository;

        public BsonRepository(IStreamRepository streamRepository)
        {
            _streamRepository = streamRepository;
        }

        public virtual void Add(TModel model)
        {
            var resourceId = Guid.NewGuid();
            _streamRepository.Add(typeof(TModel).Name, resourceId, stream =>
            {
                using (var bsonWriter = new BsonBinaryWriter(stream))
                {
                    BsonSerializer.Serialize(bsonWriter, typeof(TModel), model, e => {});
                }
            });
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            foreach (var id in _streamRepository.List(typeof(TModel).Name))
            {
                yield return _streamRepository.Read(typeof(TModel).Name, id, stream =>
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
