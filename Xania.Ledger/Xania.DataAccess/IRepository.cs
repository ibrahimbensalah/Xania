using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Xania.DataAccess
{
    public interface IRepository<TModel>: IEnumerable<TModel>
    {
        TModel Create();

        void Add(TModel model);

        void Delete(TModel model);
    }
}
