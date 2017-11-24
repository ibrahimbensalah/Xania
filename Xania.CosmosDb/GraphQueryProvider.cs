﻿using System;
using System.Linq;
using System.Linq.Expressions;

namespace Xania.CosmosDb
{
    public class GraphQueryProvider : IQueryProvider
    {
        private readonly Client _client;

        public GraphQueryProvider(Client client)
        {
            _client = client;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            throw new NotImplementedException();
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new GraphQueryable<TElement>(this, expression);
        }

        public object Execute(Expression expression)
        {
            throw new NotImplementedException();
        }

        public TResult Execute<TResult>(Expression expression)
        {
            bool IsEnumerable = (typeof(TResult).Name == "IEnumerable`1");
            throw new NotImplementedException();
        }
    }
}