using System;

namespace Xania.CosmosDb.AST
{
    internal class Route : IPipe
    {
        private readonly IStep _target;
        private readonly string _name;

        public Route(IStep target, string name)
        {
            _target = target;
            _name = name;
        }

        public string ToGremlin()
        {
            return $"out('{_name}').{_target.ToGremlin()}";
        }

        public IStep Has(IStep step)
        {
            var binary = new Binary("has", new Constant(_name), step);
            if (_target is IPipe pipe)
                return new Traverse(pipe, binary);
            return binary;
        }

        public IStep Where(IStep predicate)
        {
            throw new NotImplementedException();
        }

        public IStep SelectMany(IStep step, IStep step1)
        {
            throw new NotImplementedException();
        }
    }

}
