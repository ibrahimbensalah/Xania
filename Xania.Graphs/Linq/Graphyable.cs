using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.Graphs.Structure;

namespace Xania.Graphs.Linq
{
    public static class Graphyable
    {
        public static Expression OutE(this Expression expression, IQueryable<Edge> edges, string edgeLabel)
        {
            var ignore = StringComparison.CurrentCultureIgnoreCase;
            return OutE(expression, edges).Where((Edge e) => e.Label.Equals(edgeLabel, ignore));
        }

        public static Expression OutE(this Expression expression, IQueryable<Edge> edges)
        {
            if (expression.Type == typeof(Vertex))
            {
                var methodInfo = new Func<Vertex, IEnumerable<Edge>, IEnumerable<Edge>>(OutE).Method;
                return Expression.Call(null, methodInfo, expression, Expression.Constant(edges));
            }
            else
            {
                var methodInfo = new Func<IEnumerable<Vertex>, IEnumerable<Edge>, IEnumerable<Edge>>(OutE).Method;
                return Expression.Call(null, methodInfo, expression, Expression.Constant(edges));
            }
        }

        public static Expression InV(this Expression expression, IEnumerable<Vertex> vertices)
        {
            var methodInfo = new Func<IEnumerable<Edge>, IEnumerable<Vertex>, IEnumerable<Vertex>>(InV).Method;
            return Expression.Call(null, methodInfo, expression, Expression.Constant(vertices));
        }

        public static IEnumerable<Edge> OutE(this Vertex v, IEnumerable<Edge> edges)
        {
            return
                from e in edges
                where v.Id.Equals(e.OutV, StringComparison.CurrentCultureIgnoreCase)
                select e;
        }

        public static IEnumerable<Edge> OutE(this IEnumerable<Vertex> vertices, IEnumerable<Edge> edges)
        {
            return 
                from v in vertices
                join e in edges on v.Id equals e.OutV
                select e;
        }

        public static IEnumerable<Vertex> InV(this IEnumerable<Edge> edges, IEnumerable<Vertex> vertices)
        {
            return 
                from e in edges
                join v in vertices on e.InV equals v.Id
                select v;
        }
    }
}