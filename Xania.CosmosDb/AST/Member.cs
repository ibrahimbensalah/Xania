using System;

namespace Xania.CosmosDb.AST
{
    internal class Member : IStep
    {
        public IStep Target { get; }
        public string Name { get; }

        public Member(IStep target, string name)
        {
            Target = target;
            Name = name;
        }

        public string ToGremlin()
        {
            if (Target == null)
                return $"out('{Name}')";
            return $"{Target.ToGremlin()}.out('{Name}')";
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
