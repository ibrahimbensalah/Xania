namespace Xania.CosmosDb.AST
{
    public class ThisStepVisitor
    {
        private readonly string _paramName;

        public ThisStepVisitor(string paramName)
        {
            _paramName = paramName;
        }

        public IExpr Convert(IExpr expr)
        {
            if (expr is Parameter p && p.Name.Equals(_paramName))
                return null;
            return ConvertStep(expr);
        }

        public virtual IExpr ConvertStep(IExpr expr)
        {
            if (expr is Equal has)
                return ConvertHas(has);
            if (expr is Constant constant)
                return ConvertConstant(constant);
            if (expr is Compose traverse)
                return ConvertTraverse(traverse);
            if (expr is Member route)
                return ConvertMember(route);
            if (expr is Parameter parameter)
                return ConvertParameter(parameter);

            throw new System.NotImplementedException($"Convert {expr.GetType().Name}");
        }

        private IExpr ConvertParameter(Parameter parameter)
        {
            return parameter;
        }

        private IExpr ConvertMember(Member member)
        {
            return new Member(Convert(member.Target), member.Name);
        }

        private IExpr ConvertTraverse(Compose compose)
        {
            var source = Convert(compose.Source);
            var step = Convert(compose.Expr);

            if (source == null)
                return step;

            return new Compose(source, step);
        }

        public virtual IExpr ConvertConstant(Constant constant)
        {
            return constant;
        }

        public virtual IExpr ConvertHas(Equal equal)
        {
            return new Equal(equal.PropertyName, Convert(equal.Right));
        }
    }
}