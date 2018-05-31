using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Xania.Graphs.Structure;

namespace Xania.Graphs.Linq
{
    public static class Graphyable
    {
        public static Expression OutE(this Expression expression, IQueryable<Edge> edges)
        {
            if (expression.Type == typeof(Vertex))
            {
                var methodInfo = new Func<Vertex, IQueryable<Edge>, IQueryable<Edge>>(OutE).Method;
                return Expression.Call(null, methodInfo, expression, Expression.Constant(edges));
            }
            else
            {
                var methodInfo = new Func<IQueryable<Vertex>, IQueryable<Edge>, IQueryable<Edge>>(OutE).Method;
                return Expression.Call(null, methodInfo, expression, Expression.Constant(edges));
            }
        }

        public static Expression InV(this Expression expression, IQueryable<Vertex> vertices)
        {
            var methodInfo = new Func<IQueryable<Edge>, IQueryable<Vertex>, IQueryable<Vertex>>(InV).Method;
            return Expression.Call(null, methodInfo, expression, Expression.Constant(vertices));
        }

        public static IQueryable<Edge> OutE(this Vertex v, IQueryable<Edge> edges)
        {
            return
                from e in edges
                where v.Id.Equals(e.OutV, StringComparison.CurrentCultureIgnoreCase)
                select e;
        }

        public static IQueryable<Edge> OutE(this IQueryable<Vertex> vertices, IQueryable<Edge> edges)
        {
            return 
                from v in vertices
                join e in edges on v.Id equals e.OutV
                select e;
        }

        public static IQueryable<Vertex> InV(this IQueryable<Edge> edges, IQueryable<Vertex> vertices)
        {
            return 
                from e in edges
                join v in vertices on e.InV equals v.Id
                select v;
        }
    }
}