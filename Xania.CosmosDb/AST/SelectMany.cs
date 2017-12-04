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
            var sourceName = Selector.Parameters[0].Name;
            var collectionName = Selector.Parameters[1].Name;

            return $"{Source.ToGremlin()}.as('{sourceName}').{Collection.ToGremlin()}.as('{collectionName}').{Selector.ToGremlin()}";
        }
    }
}