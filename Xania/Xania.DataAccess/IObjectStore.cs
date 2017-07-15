using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public interface IObjectStore<TModel> : IEnumerable<TModel>
    {
        Task<TModel> AddAsync(TModel model);

        Task DeleteAsync(Expression<Func<TModel, bool>> condition);
        Task UpdateAsync(Expression<Func<TModel, bool>> condition, TModel user);
    }

    public static class ObjectStoreExtensions
    {
        public static TModel Add<TModel>(this IObjectStore<TModel> store, TModel model)
        {
            return store.AddAsync(model).Result;
        }
    }
}
