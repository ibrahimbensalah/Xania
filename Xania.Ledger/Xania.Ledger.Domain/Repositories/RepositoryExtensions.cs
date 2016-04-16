namespace Xania.Ledger.Domain.Repositories
{
    public static class RepositoryExtensions
    {
        public static void Delete<TModel>(this IRepository<TModel> repository, TModel model) 
            where TModel : class
        {
            repository.Delete(m => m == model);
        }
    }
}