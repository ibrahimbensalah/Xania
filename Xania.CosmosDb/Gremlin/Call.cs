using System.Collections.Generic;
using System.Linq;

namespace Xania.CosmosDb.Gremlin
{

    public interface IGremlinExpr
    {
    }

    public class Is : Call
    {
        public Is(params IGremlinExpr[] expressions) :
            base("is", expressions)
        {
        }

        public Is(IEnumerable<IGremlinExpr> expressions) : 
            base("is", expressions)
        {
        }
    }

    public class Eq : Call
    {
        public Eq(params IGremlinExpr[] expressions) :
            base("eq", expressions)
        {
        }

        public Eq(IEnumerable<IGremlinExpr> expressions) :
            base("eq", expressions)
        {
        }
    }

    public class Call : IGremlinExpr
    {
        public string MethodName { get; }
        private readonly IEnumerable<IGremlinExpr> _expressions;

        public Call(string methodName, params IGremlinExpr[] expressions)
        {
            MethodName = methodName;
            _expressions = expressions;
        }

        public Call(string methodName, IEnumerable<IGremlinExpr> expressions)
        {
            MethodName = methodName;
            _expressions = expressions;
        }

        public override string ToString()
        {
            return $"{MethodName}({string.Join(",", _expressions.Select(e => e.ToString()))})";
        }
    }

    public class Scope: IGremlinExpr
    {
        public string MethodName { get; }
        public Traversal Traversal { get; }

        public Scope(string methodName, Traversal traversal)
        {
            MethodName = methodName;
            Traversal = traversal;
        }

        public override string ToString()
        {
            return $"{MethodName}({Traversal})";
        }
    }

    public class Bind : IGremlinExpr
    {
        public IGremlinExpr[] Expressions { get; }

        public Bind(IGremlinExpr[] expressions)
        {
            Expressions = expressions;
        }

        public override string ToString()
        {
            return string.Join(".", Expressions.Select(e => e.ToString()));
        }
    }
}
