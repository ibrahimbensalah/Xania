using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace Xania.Graphs.EntityFramework.Tests.Relational.Queries
{
    public class DbQueryable<T>: IQueryable<T>
    {
        public DbQueryable(IQueryProvider provider)
        {
            Provider = provider;
            ElementType = typeof(T);
            var root = Enumerable.Empty<T>().AsQueryable();
            Expression = Expression.Constant(root);
        }

        public DbQueryable(IQueryProvider provider, Expression expression)
        {
            Provider = provider;
            ElementType = typeof(T);
            Expression = expression;
        }

        public IEnumerator<T> GetEnumerator()
        {
            return Provider.Execute<IEnumerable<T>>(Expression).GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Type ElementType { get; }
        public Expression Expression { get; }
        public IQueryProvider Provider { get; }
    }
}
