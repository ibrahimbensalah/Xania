using System.Linq;

namespace Xania.CosmosDb.AST
{
    public class MemberCall: IExpr
    {
        private readonly IExpr _target;
        private readonly string _methodName;
        private readonly IExpr[] _args;

        public MemberCall(IExpr target, string methodName, IExpr[] args)
        {
            _target = target;
            _methodName = methodName;
            _args = args;
        }

        public string ToGremlin()
        {
            if (_target == null)
                return $"{_methodName}({string.Join(", ", _args.Select(e => e.ToGremlin()))})";
            return $"{_target.ToGremlin()}.{_methodName}({string.Join(", ", _args.Select(e => e.ToGremlin()))})";
        }
    }
}
