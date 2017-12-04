using System.Linq;

namespace Xania.CosmosDb.AST
{
    public class Lambda : IStep
    {
        public Parameter[] Parameters { get; }
        public IStep Body { get; }

        public Lambda(Parameter[] parameters, IStep body)
        {
            Parameters = parameters;
            Body = body;
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