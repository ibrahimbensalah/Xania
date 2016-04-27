using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Xania.DataAccess
{
    public interface IRepository<TModel>: IQueryable<TModel>
    {
        TModel Create();

        void Add(TModel model);

        void Delete(Expression<Func<TModel, bool>> predicate);
    }

    public class RepositoryBase<TModel> : IRepository<TModel>
    {
        public IEnumerator<TModel> GetEnumerator()
        {
            throw new NotImplementedException();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Expression Expression { get; private set; }
        public Type ElementType { get; private set; }
        public IQueryProvider Provider { get; private set; }
        public TModel Create()
        {
            throw new NotImplementedException();
        }

        public void Add(TModel model)
        {
            throw new NotImplementedException();
        }

        public void Delete(Expression<Func<TModel, bool>> predicate)
        {
            throw new NotImplementedException();
        }
    }
}
