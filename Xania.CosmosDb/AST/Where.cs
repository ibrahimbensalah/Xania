﻿using System;
using System.Linq;

namespace Xania.CosmosDb.AST
{
    internal class Where : IStep
    {
        public Vertex Source { get; }
        public Lambda Predicate { get; }


        public Where(Vertex source, Lambda predicate)
        {
            Source = source;
            Predicate = predicate;
        }

        public string ToGremlin()
        {
            return $"{Source.ToGremlin()}.where({Predicate.ToGremlin()})";
        }
    }
}
