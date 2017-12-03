using System;
using System.Collections.Generic;
using System.Linq;
using Xania.CosmosDb.AST;

namespace Xania.CosmosDb
{
    internal class LambdaExpr : GremlinExpr
    {
        public LambdaExpr(int parametersCount)
        {
            Count = 1 + parametersCount;
        }

        public override IStep ToGremlin(params IStep[] args)
        {
            return new AST.Lambda(args.Take(args.Length - 1).Cast<Parameter>().ToArray(), args.Last());
        }
    }
}

namespace Xania.CosmosDb.AST
{
    public class Lambda : IStep
    {
        public IStep Body { get; }
        public Parameter[] Parameters { get; }

        public Lambda(Parameter[] parameters, IStep body)
        {
            Parameters = parameters;

            if (parameters.Length == 1)
            {
                var param = parameters.Single();
                Body = new ReplaceVisitor(s => s is Parameter p && p.Name.Equals(param.Name), new ContextNode()).Convert(body);
            }
            else
                Body = body;
        }

        public string ToGremlin()
        {
            return $"{Body.ToGremlin()}";
        }

        public IStep Has(IStep step)
        {
            throw new System.NotImplementedException();
        }
    }

    public class ReplaceVisitor
    {
        private readonly Func<IStep, bool> _predicate;
        private readonly IStep _replacement;

        public ReplaceVisitor(Func<IStep, bool> predicate, IStep replacement)
        {
            _predicate = predicate;
            _replacement = replacement;
        }

        public IStep Convert(IStep step)
        {
            return _predicate(step) ? _replacement : ConvertStep(step);
        }

        public virtual IStep ConvertStep(IStep step)
        {
            if (step is Binary binary)
                return ConvertBinary(binary);
            if (step is Constant constant)
                return ConvertConstant(constant);
            if (step is Traverse traverse)
                return ConvertTraverse(traverse);
            if (step is Route route)
                return ConvertRoute(route);
            if (step is Parameter parameter)
                return ConvertParameter(parameter);

            throw new System.NotImplementedException($"Convert {step.GetType().Name}");
        }

        private IStep ConvertParameter(Parameter parameter)
        {
            return parameter;
        }

        private IStep ConvertRoute(Route route)
        {
            return new Route(Convert(route.Target), route.Name);
        }

        private IStep ConvertTraverse(Traverse traverse)
        {
            return new Traverse(Convert(traverse.Source), Convert(traverse.Step));
        }

        public  virtual IStep ConvertConstant(Constant constant)
        {
            return constant;
        }

        public virtual IStep ConvertBinary(Binary binary)
        {
            return new Binary(binary.Oper, Convert(binary.Left), Convert(binary.Right));
        }
    }

    public class ContextNode : IStep
    {
        public string ToGremlin()
        {
            return "__";
        }

        public IStep Has(IStep step)
        {
            throw new System.NotImplementedException();
        }
    }
}