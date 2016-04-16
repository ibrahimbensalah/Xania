using System;
using System.Linq;
using System.Linq.Expressions;

namespace Xania.Ledger.Domain.Repositories
{
    public interface IRepository<TModel>: IQueryable<TModel>
        where TModel: class
    {
        void Add(TModel model);

        void Delete(Expression<Func<TModel, bool>> predicate);
    }
}
