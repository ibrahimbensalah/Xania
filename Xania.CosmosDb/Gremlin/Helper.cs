using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Xania.CosmosDb.Gremlin
{
    public static class Helper
    {
        public static Traversal ToTraversal(this IGremlinExpr expr)
        {
            return new Traversal(expr);
        }

        //public static IEnumerable<T> Prepend<T>(this T item, IEnumerable<T> source)
        //{
        //    return new PrependEnumerable<T>(source, item);
        //}

        /*
        public static IGremlinExpr ToGremlin(IExpr expression)
        {
            if (expression == null)
                return null;
            if (expression is Where where)
            {
                var parameter = where.Predicate.Parameters[0];
                var predicate = ToGremlin(where.Predicate);
                var source = ToGremlin(where.Source);
                var (head, tail) = HeadTail(predicate);
                if (head is Select select && select.Label.Equals(parameter.Name))
                {
                    if (tail == null)
                        return source;
                    return Bind(source, tail);
                }
                return new Bind(Unfold(source).Concat(new []{ As(parameter.Name), Call("where", predicate) }).ToArray());
            }
            if (expression is AST.Vertex vertex)
                return Call("hasLabel", Const(vertex.Label));
            if (expression is Lambda lambda)
                return ToGremlin(lambda.Body);
            if (expression is Compose compose)
                return Bind(ToGremlin(compose.Source), ToGremlin(compose.Expr));
            if (expression is Parameter param)
                return new Select(param.Name);
            if (expression is Equal equal)
                return Call("has", Const(equal.PropertyName), ToGremlin(equal.Right));
            if (expression is Constant cons)
                return Const(cons.Value);
                // return $"has('{PropertyName}', {Right.ToGremlin()})";
            if (expression is AST.Member member)
                return Member(ToGremlin(member.Target), member.Name);
            if (expression is SelectMany selectMany)
            {
                var sourceParam = selectMany.Selector.Parameters[0];
                var collectionParam = selectMany.Selector.Parameters[1];

                var selector = ToGremlin(selectMany.Selector);
                var source = ToGremlin(selectMany.Source);
                var collection = ToGremlin(selectMany.Collection);
                // if (collectionParam == selector.Body)
                //    return new Bind(source.Concat(Unfold(ToGremlin(collection))).ToArray());

                // $"{Source.ToGremlin()}.as('{sourceParam.Name}')
                //   .{ Collection.ToGremlin()}.as('{collectionParam.Name}')
                //   .{Selector.ToGremlin()}";

                return new Bind(
                    Unfold(source)
                        .Concat(Unfold(As(sourceParam.Name)))
                        .Concat(Unfold(collection))
                        .Concat(Unfold(As(collectionParam.Name)))
                        .Concat(Unfold(selector))
                        .ToArray()
                );
            }
            if (expression is AST.Term term)
                return new Term(term.Expression);

            if (expression is New)
                return null;

            throw new NotImplementedException($"ToGremlin {expression}");
        }
        */

        public static IEnumerable<IGremlinExpr> Unfold(IGremlinExpr expr)
        {
            if (expr is Bind bind)
                foreach (var child in bind.Expressions.SelectMany(Unfold))
                {
                    yield return child;
                }
            else if (expr != null)
                yield return expr;
        }

        public static (IGremlinExpr, IEnumerable<IGremlinExpr>) HeadTail(IGremlinExpr expr)
        {
            if (expr is Bind bind)
            {
                var (head, tail1) = HeadTail(bind.Expressions[0]);
                var tail2 = bind.Expressions.Skip(1);
                return (head, tail1.Concat(tail2));
            }
            return (expr, Enumerable.Empty<IGremlinExpr>());
        }
    }

    public class AppendEnumerable<T>: IEnumerable<T>
    {
        private readonly IEnumerable<T> _source;
        private readonly T _item;

        public AppendEnumerable(IEnumerable<T> source, T item)
        {
            _source = source;
            _item = item;
        }

        public IEnumerator<T> GetEnumerator()
        {
            foreach (var i in _source)
                yield return i;
            yield return _item;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
    public class PrependEnumerable<T>: IEnumerable<T>
    {
        private readonly IEnumerable<T> _source;
        private readonly T _item;

        public PrependEnumerable(IEnumerable<T> source, T item)
        {
            _source = source;
            _item = item;
        }

        public IEnumerator<T> GetEnumerator()
        {
            yield return _item;
            foreach (var i in _source)
                yield return i;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }

    public class Const : IGremlinExpr
    {
        public object Value { get; }

        public Const(object value)
        {
            Value = value;
        }

        public override string ToString()
        {
            return JsonConvert.SerializeObject(Value);
        }
    }
}
