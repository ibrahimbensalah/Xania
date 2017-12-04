using System.Linq;

namespace Xania.CosmosDb.AST
{
    public class MemberCall: IStep
    {
        private readonly IStep _target;
        private readonly string _methodName;
        private readonly IStep[] _args;

        public MemberCall(IStep target, string methodName, IStep[] args)
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
