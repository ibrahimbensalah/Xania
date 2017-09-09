using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace Xania.QL
{
    internal static class ExpressionReplacer
    {
        // Produces an expression identical to 'expression'
        // except with 'source' parameter replaced with 'target' expression.     
        public static Expression Replace(Expression expression, Expression source, Expression target)
        {
            if (source.Type != target.Type)
                throw new InvalidOperationException(string.Format("Type mismatch {0} != {1}", source.Type.Name, target.Type.Name));

            var result = new ReplaceVisitor(source, target)
                .VisitAndConvert(expression);

            if (result == source)
                throw new InvalidOperationException();

            return result;
        }

        private class ReplaceVisitor : ExpressionVisitor
        {
            private readonly Expression _source;
            private readonly Expression _target;

            public ReplaceVisitor(Expression source, Expression target)
            {
                if (source.Type != target.Type)
                    throw new InvalidOperationException();

                _source = source;
                _target = target;
            }

            internal Expression VisitAndConvert(Expression root)
            {
                return Visit(root);
            }

            public override Expression Visit(Expression node)
            {
                if (node == _source)
                    return _target;

                return base.Visit(node);
            }
        }

        public static Expression ReplaceParameters(Expression selectorExpr, IContext context)
        {
            return new ParameterReplaceVisitor(context)
                .VisitAndConvert(selectorExpr);
        }

        private class ParameterReplaceVisitor : ExpressionVisitor
        {
            private readonly IContext _context;

            public ParameterReplaceVisitor(IContext context)
            {
                _context = context;
            }

            internal Expression VisitAndConvert(Expression root)
            {
                return Visit(root);
            }

            protected override Expression VisitParameter(ParameterExpression node)
            {
                var expr = _context.Get(node.Name);
                if (expr == null)
                    throw new Exception("Cannot resolve variable name " + node.Name);

                if (expr.Type != node.Type)
                    throw new Exception(string.Format("Cannot cast variable name {0} of type {1} to type {2}", node.Name, node.Type.Name, expr.Type.Name));

                return expr;
            }
        }
    }
}
