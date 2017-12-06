using System.Linq;

namespace Xania.CosmosDb.AST
{
    public class Lambda : IExpr
    {
        public Parameter[] Parameters { get; }
        public IExpr Body { get; }

        public Lambda(Parameter[] parameters, IExpr body)
        {
            Parameters = parameters;
            Body = body;
        }

        public bool IsIdentity()
        {
            return Parameters.Length == 1 && Parameters[0] == Body;
        }

        public string ToGremlin()
        {
            if (Parameters.Length == 1)
            {
                var param = Parameters.Single();
                var body = new ThisStepVisitor(param.Name).Convert(Body);
                return $"{body.ToGremlin()}";
            }
            else
                return $"{Body.ToGremlin()}";
        }
    }
}