using System;
using System.Collections.Generic;
using Xania.Graphs.Structure;
using Xania.ObjectMapper;

namespace Xania.Graphs.Linq
{
    internal class MappableObject : IMappable
    {
        public GraphObject Obj { get; }

        public MappableObject(GraphObject obj)
        {
            Obj = obj;
        }

        public IOption<IMapping> To(Type targetType)
        {
            return new ObjectMapping(GetValues(), targetType).Some();
        }

        private IEnumerable<KeyValuePair<string, object>> GetValues()
        {
            foreach (var prop in Obj.Properties)
            {
                yield return new KeyValuePair<string, object>(prop.Name, prop.Value);
            }
        }
    }
}