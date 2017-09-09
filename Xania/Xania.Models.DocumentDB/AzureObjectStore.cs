using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.Documents.Client;
using Xania.DataAccess;
using Xania.Models;

namespace Xania.Data.DocumentDB
{
    public class AzureObjectStore<T> : IObjectStore<T>
    {
        private readonly DocumentClient _client;

        public AzureObjectStore(DocumentClient client)
        {
            _client = client;
        }
        public async Task<IEnumerator<T>> GetEnumeratorAsync()
        {
            var response = await _client.ReadDocumentCollectionAsync(typeof(T).Name, new RequestOptions());
            return null;
        }

        public IEnumerator<T> GetEnumerator()
        {
            return GetEnumeratorAsync().Result;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Task<T> AddAsync(T model)
        {
            throw new NotImplementedException();
        }

        public Task DeleteAsync(Expression<Func<T, bool>> condition)
        {
            throw new NotImplementedException();
        }

        public Task UpdateAsync(Expression<Func<T, bool>> condition, T user)
        {
            throw new NotImplementedException();
        }
    }
}
