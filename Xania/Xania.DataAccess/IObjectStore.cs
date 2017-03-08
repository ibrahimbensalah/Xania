using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Xania.DataAccess
{
    public interface IObjectStore<TModel> : IEnumerable<TModel>
    {
        Task<TModel> AddAsync(TModel model);

        Task DeleteAsync(TModel model);
        Task SaveAsync(Expression<Func<TModel, bool>> condition, TModel user);
    }
}
