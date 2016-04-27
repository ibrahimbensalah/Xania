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
            });
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            yield break;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
