using System.Linq;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Runtime.Tests
{
    public class RuntimeTests: RuntimeBaseTests
    {
        protected override IQueryable<TModel> Set<TModel>(params object[] models)
        {
            var db = new InMemoryGraphDataContext(models);
            return db.Set<TModel>();
        }
    }
}
