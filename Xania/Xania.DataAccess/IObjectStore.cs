using System.Collections.Generic;

namespace Xania.DataAccess
{
    public interface IObjectStore<TModel> : IEnumerable<TModel>
    {
        void Add(TModel model);

        void Delete(TModel model);
    }
}
