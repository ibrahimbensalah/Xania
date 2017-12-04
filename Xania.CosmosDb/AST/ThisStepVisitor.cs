namespace Xania.CosmosDb.AST
{
    public class ThisStepVisitor
    {
        private readonly string _paramName;

        public ThisStepVisitor(string paramName)
        {
            _paramName = paramName;
        }

        public IStep Convert(IStep step)
        {
            if (step is Parameter p && p.Name.Equals(_paramName))
                return null;
            return ConvertStep(step);
        }

        public virtual IStep ConvertStep(IStep step)
        {
            if (step is Has has)
                return ConvertHas(has);
            if (step is Constant constant)
                return ConvertConstant(constant);
            if (step is Traverse traverse)
                return ConvertTraverse(traverse);
            if (step is Member route)
                return ConvertMember(route);
            if (step is Parameter parameter)
                return ConvertParameter(parameter);

            throw new System.NotImplementedException($"Convert {step.GetType().Name}");
        }

        private IStep ConvertParameter(Parameter parameter)
        {
            return parameter;
        }

        private IStep ConvertMember(Member member)
        {
            return new Member(Convert(member.Target), member.Name);
        }

        private IStep ConvertTraverse(Traverse traverse)
        {
            var source = Convert(traverse.Source);
            var step = Convert(traverse.Step);

            if (source == null)
                return step;

            return new Traverse(source, step);
        }

        public virtual IStep ConvertConstant(Constant constant)
        {
            return constant;
        }

        public virtual IStep ConvertHas(Has has)
        {
            return new Has(has.PropertyName, Convert(has.Right));
        }
    }
}