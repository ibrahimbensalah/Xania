using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace Xania.Graphs.EntityFramework.Tests.Relational.Queries
{
    public class VertexQuery : IQueryable<Elements.Vertex>
    {
        private readonly IQueryable<Vertex> _vertices;

        public VertexQuery(IQueryable<Relational.Vertex> vertices)
        {
            _vertices = vertices;
        }

        public IEnumerator<Elements.Vertex> GetEnumerator()
        {
            throw new NotImplementedException();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Type ElementType => _vertices.ElementType;
        public Expression Expression => _vertices.Expression;
        public IQueryProvider Provider => _vertices.Provider;
    }
}
