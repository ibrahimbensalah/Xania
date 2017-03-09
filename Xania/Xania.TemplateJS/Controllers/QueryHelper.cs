using System;
using System.Collections.Generic;

namespace Xania.TemplateJS.Controllers
{
    public static class QueryHelper
    {
        public static object accept(dynamic ast, Store store)
        {
            var type = (ExpressionType)ast.type;
            switch (type)
            {
                case ExpressionType.IDENT:
                    var name = (string) ast.name;
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
}