using System;

namespace Xania.CosmosDb.AST
{
    public class SelectMany : IStep
    {
        public IStep Source { get; }
        public Lambda Collection { get; }
        public Lambda Selector { get; }

        public SelectMany(IStep source, Lambda collection, Lambda selector)
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

            return $"{Source.ToGremlin()}.as('{sourceParam.Name}').{Collection.ToGremlin()}.as('{collectionParam.Name}').{Selector.ToGremlin()}";
        }
    }
}