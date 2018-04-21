using System;
using Xania.Reflection;

namespace Xania.Graphs
{
    public class Out : IStep
    {
        public string EdgeLabel { get; }
        public Type Type { get; }
        public bool Many { get; }

        public Out(string edgeLabel, Type type, bool many)
        {
            EdgeLabel = edgeLabel;
            Type = type;
            Many = many;
        }

        public override string ToString()
        {
            if (Type == null)
                return $"out('{EdgeLabel}')";

            if (Type.IsEnumerable())
            {
                var elementType = Type.GetItemType();
                return $"out('{EdgeLabel}').hasLabel('{elementType.Name.ToCamelCase()}')";
            }

            return $"out('{EdgeLabel}').hasLabel('{Type.Name.ToCamelCase()}')";
        }
    }
}