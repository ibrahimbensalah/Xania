using System;
using System.Collections;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.IO;

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
            _streamRepository.Add(typeof(TModel).Name, resourceId, s =>
            {
                var doc = MongoDB.Bson.BsonBinaryData.Create(model);
                var writer= new BsonBinaryWriter(s);
                writer.WriteBinaryData(doc);
            });
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            foreach (var id in _streamRepository.List(typeof(TModel).Name))
            {
                // _streamRepository.Read()
            }
            yield break;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
