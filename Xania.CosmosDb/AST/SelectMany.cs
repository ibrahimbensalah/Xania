using System;

namespace Xania.CosmosDb.AST
{
    public class SelectMany : IExpr
    {
        public IExpr Source { get; }
        public Lambda Collection { get; }
        public Lambda Selector { get; }

        public SelectMany(IExpr source, Lambda collection, Lambda selector)
        {
            Source = source;
            Collection = collection;
            Selector = selector;
        }

        public string ToGremlin()
        {
            var sourceParam = Selector.Parameters[0];
            var collectionParam = Selector.Parameters[1];

            if (collectionParam == Selector.Body)
                return $"{Source.ToGremlin()}.{Collection.ToGremlin()}";
            //if (collectionParam == GetSeed(Selector.Body))
            //    return $"{Source.ToGremlin()}.{Collection.ToGremlin()}.{Selector.ToGremlin()}";

            return $"{Source.ToGremlin()}.as('{sourceParam.Name}').{Collection.ToGremlin()}.as('{collectionParam.Name}').{Selector.ToGremlin()}";
        }

        private IExpr GetSeed(IExpr selector)
        {
            if (selector is Parameter)
                return selector;
            if (selector is Member member)
                return GetSeed(member.Target);
            return null;
        }
    }
}