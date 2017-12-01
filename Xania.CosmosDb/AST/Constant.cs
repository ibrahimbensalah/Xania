using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.CosmosDb.AST
{
    public class Constant : IStep
    {
        private object value;

        public Constant(object value)
        {
            this.value = value;
        }

        public string ToGremlin()
        {
            return $"'{value}'";
        }

        public IStep Has(IStep step)
        {
            throw new NotImplementedException();
        }
    }
}
