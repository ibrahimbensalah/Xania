using System;
using System.Linq;
using System.Linq.Expressions;

namespace Xania.Data
{
    public interface IRepository<TModel>: IQueryable<TModel>
    {
        TModel Create();

        void Add(TModel model);

        void Delete(Expression<Func<TModel, bool>> predicate);
    }
}
