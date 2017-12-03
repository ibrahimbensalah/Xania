﻿using System;

namespace Xania.CosmosDb.AST
{
    internal class Where : IStep
    {
        private readonly IStep _source;
        private readonly IStep _predicate;

        public Where(IStep source, IStep predicate)
        {
            _source = source;
            _predicate = predicate;
        }

        public string ToGremlin()
        {
            return $"{_source.ToGremlin()}.where({_predicate.ToGremlin()})";
        }

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }
    }
}
