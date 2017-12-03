using System;

namespace Xania.CosmosDb.AST
{
    internal class Route : IPipe
    {
        public IStep Target { get; }
        public string Name { get; }

        public Route(IStep target, string name)
        {
            Target = target;
            Name = name;
        }

        public string ToGremlin()
        {
            return $"{Target.ToGremlin()}.out('{Name}')";
        }

        public IStep Has(IStep step)
        {
            var binary = new Binary("has", new Constant(Name), step);
            return new Traverse(Target, binary);
        }

        public IStep Where(Lambda predicate)
        {
            throw new NotImplementedException();
        }

        public IStep SelectMany(IStep collectionStep, IStep step1)
        {
            throw new NotImplementedException();
        }
    }

}
