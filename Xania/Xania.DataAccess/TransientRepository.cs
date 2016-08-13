using System;
using System.Collections;
using System.Collections.Generic;

namespace Xania.DataAccess
{
    public class TransientRepository<TModel> : IRepository<TModel>
        where TModel : new()
    {
        private static readonly List<TModel> Items;

        static TransientRepository()
        {
            Items = new List<TModel>();
        }

        public IEnumerator<TModel> GetEnumerator()
        {
            return Items.GetEnumerator();
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
            Items.Add(model);
        }

        public void Delete(TModel model)
        {
            Items.Remove(model);
        }
    }
}