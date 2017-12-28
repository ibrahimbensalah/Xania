using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xania.DataAccess;
using Xania.Graphs.Linq;

namespace Xania.CosmosDb
{
    public class AzureGraphStore<T> : IObjectStore<T>
    {
        private readonly CosmosDbClient client;
        public AzureGraphStore(CosmosDbClient client)
        {
            this.client = client;
        }

        public IEnumerator<T> GetEnumerator()

        {
            return Query().GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public async Task<T> AddAsync(T model)
        {
            await client.UpsertAsync(model);
            return model;
        }

        public Task UpdateAsync(T model)
        {
            return client.UpsertAsync(model);
        }

        public Task DeleteAsync(Expression<Func<T, bool>> condition)
        {
            new GraphQueryable<T>(new GraphQueryProvider(client)).Where(condition).Drop();
            return Task.CompletedTask;
        }

        public IQueryable<T> Query()
        {
            return new GraphQueryable<T>(new GraphQueryProvider(client));
        }
    }
}
