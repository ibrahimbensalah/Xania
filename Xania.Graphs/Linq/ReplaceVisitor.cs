using System;
using System.Linq.Expressions;

namespace Xania.Graphs.Linq
{
    public class ReplaceVisitor : ExpressionVisitor
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

        public static Expression VisitAndConvert(Expression body, Expression needle, Expression value)
        {
            return new ReplaceVisitor(needle, value).VisitAndConvert(body);
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
}