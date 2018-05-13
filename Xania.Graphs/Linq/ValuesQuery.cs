using System;
using System.Linq;
using Xania.Graphs.Structure;

namespace Xania.Graphs.Linq
{
    internal class ValuesQuery
    {
        public static object GetMember(object v, string name, Type memberType)
        {
            if (v is Vertex vtx && name.Equals("id", StringComparison.InvariantCultureIgnoreCase))
            {
                return vtx.Id;
            }

            if (v is Vertex obj)
            {
                return obj.Properties.Where(p => p.Name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                    .Select(p => p.Value2).FirstOrDefault();
            }

            throw new NotImplementedException();
        }
    }
}