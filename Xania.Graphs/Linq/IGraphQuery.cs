using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using Xania.Graphs.Gremlin;

namespace Xania.Graphs.Linq
{
    public interface IGraphQuery
    {
        object Execute(Type elementType);
        IGraphQuery Next(Type sourceType, IStep step, IEnumerable<(string name, Expression result)> mappings);
        Expression SourceExpression { get; }
    }
}