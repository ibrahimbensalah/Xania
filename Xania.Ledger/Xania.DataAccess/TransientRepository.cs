using System;
using System.Collections;
using System.Collections.Generic;

namespace Xania.DataAccess
{
    public class TransientRepository<TModel> : IRepository<TModel>
        where TModel : new()
    {
        private readonly List<TModel> _items;

        public TransientRepository()
        {
            _items = new List<TModel>();
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            return _items.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public TModel Create()
        {
            return new TModel();
        }

        public void Add(TModel model)
        {
            _items.Add(model);
        }

        public void Delete(TModel model)
        {
            _items.Remove(model);
        }
    }
}