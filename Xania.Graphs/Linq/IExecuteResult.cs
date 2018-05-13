using System.Collections.Generic;

namespace Xania.Graphs.Linq
{
    public interface IExecuteResult
    {
        IExecuteResult Execute(IStep step, IEnumerable<(string name, IExecuteResult result)> mappings);
        // object ToClrType(Type elementType, Graph graph);
    }
}