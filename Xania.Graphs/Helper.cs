using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Structure;

namespace Xania.Graphs
{
    public static class GraphExtensions
    {
        public static GraphTraversal ToTraversal(this IStep expr)
        {
            return new GraphTraversal(expr);
        }

        public static IEnumerable<T> AsEnumerable<T>(this T item)
        {
            yield return item;
        }

        public static string GenerateChecksum(this object value)
        {
            if (value is string str)
                return str;
            if (value.GetType().IsPrimitive)
                return value.ToString();
            if (value is GraphPrimitive prim)
                return prim.Value.ToString();
            if (value is GraphObject obj)
                return obj.Properties.SelectMany(p => GetBytes(p.Value)).ComputeHash().Format();
            if (value is GraphList list)
                return list.Items.SelectMany(GetBytes).ComputeHash().Format();

            throw new NotImplementedException("GenerateChecksum: " + value.GetType());
        }

        public static byte[] GenerateHash(this object value)
        {
            if (value is GraphValue gv)
                return gv.GetBytes().ComputeHash();

            if (value is string str)
                return GenerateHash(new GraphPrimitive(str));

            throw new NotImplementedException("GenerateHash: " + value.GetType());
        }

        public static IEnumerable<byte> GetBytes(this GraphValue value)
        {
            if (value is GraphPrimitive prim)
                return Encoding.UTF8.GetBytes(prim.Value.ToString());
            if (value is GraphObject obj)
                return obj.Properties.SelectMany(p => GetBytes(p.Value));
            if (value is GraphList list)
                return list.Items.SelectMany(GetBytes);

            throw new NotImplementedException("GetBytes: " + value.GetType());
        }

        public static byte[] ComputeHash(this IEnumerable<byte> bytes)
        {
            using (var sha = SHA256.Create())
            {
                // Convert the input string to a byte array and compute the hash.
                return sha.ComputeHash(bytes.ToArray());
            }
        }

        public static string Format(this byte[] data)
        {
            StringBuilder sb = new StringBuilder();

            foreach (var t in data)
                sb.Append(t.ToString("x2"));

            return sb.ToString();
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
        }

        public Type Type { get; }
    }
}
