using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            return $"{_target.ToGremlin()}.out('{_name}')";
        }

        public IStep Has(IStep step)
        {
            var binary = new Binary("has", new Constant(_name), step);
            if (_target is IPipe pipe)
                return new Traverse(pipe, binary).Inverse();
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

        public IPipe Inverse()
        {
            throw new NotImplementedException();
        }
    }

}
