using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public static class Helper
    {
        public static GraphTraversal ToTraversal(this IStep expr)
        {
            return new GraphTraversal(expr);
        }

        public static IEnumerable<T> AsEnumerable<T>(this T item)
        {
            yield return item;
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

    public class Const : IStep
    {
        public object Value { get; }

        public Const(object value)
        {
            Value = value;
            Type = value.GetType();
        }

        public override string ToString()
        {
            if (Value is string str)
                return $"'{str}'";
            return Value?.ToString() ?? string.Empty;
            // return JsonConvert.SerializeObject(Value);
        }

        public Type Type { get; }
    }
}
