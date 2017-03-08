using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public class TransientObjectStore<TModel> : IObjectStore<TModel>
        where TModel : new()
    {
        private static readonly List<TModel> Items;

        static TransientObjectStore()
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

        public Task<TModel> AddAsync(TModel model)
        {
            Items.Add(model);
            return Task.FromResult(model);
        }

        public Task DeleteAsync(TModel model)
        {
            Items.Remove(model);
            return Task.CompletedTask;
        }
    }
}