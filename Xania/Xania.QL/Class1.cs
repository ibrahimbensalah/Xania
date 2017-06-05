using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Xania.QL
{
    public enum Token : int
    {
        WHERE = 1,
        QUERY = 2,
        IDENT = 3,
        MEMBER = 4,
        APP = 5,
        SELECT = 6,
        CONST = 7,
        RANGE = 8,
        BINARY = 9,
        AWAIT = 10,
        PIPE = 11,
        COMPOSE = 12,
        LAMBDA = 13
    }

    public static class QueryHelper
    {
        public static object accept(dynamic ast, Store store)
        {
            var type = (Token)ast.type;
            switch (type)
            {
                case Token.IDENT:
                    var name = (string)ast.name;
                    return store.Get(name);
                default:
                    throw new InvalidOperationException("unsupported type: " + type);
            }
        }

        public static object accept(object ast, Dictionary<string, object> values)
        {
            return accept(ast, new Store(values));
        }
    }

    public class Store
    {
        private readonly IDictionary<string, object> _values;

        public Store(IDictionary<string, object> values)
        {
            _values = values;
        }
        public object Get(string name)
        {
            object value;
            return _values.TryGetValue(name, out value) ? value : null;
        }
    }

}
