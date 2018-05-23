using System.Collections.Generic;

namespace Xania.Graphs.EntityFramework.Tests.Relational
{
    public interface IGraphObject : IGraphValue
    {
        HashSet<Property> Properties { get; }
    }
}