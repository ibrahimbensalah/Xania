using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace Xania.Reflection
{
    public static class ConvertExtensions
    {
        /// <summary>
        /// TODO 
        /// </summary>
        /// <param name="source"></param>
        /// <param name="targetType"></param>
        /// <returns></returns>
        public static object Convert(this object source, Type targetType)
        {
            if (source == null)
                return null;

            if (targetType == null)
                throw new InvalidOperationException();

            if (source.GetType() == targetType)
                return source;

            if (targetType == typeof(Guid))
                return ConvertToGuid(source);

            if (source is string)
                return System.Convert.ChangeType(source, targetType);

            if (source is IDictionary<string, Object> dict)
                return ConvertDictionary(dict, targetType);

            if (source is IEnumerable enumerable)
                return ConvertMany(enumerable, targetType);

            if (targetType.IsEnumerable())
            {
                return targetType.CreateCollection(source);
            }

            return Activator.CreateInstance(targetType);
        }

        private static Guid ConvertToGuid(object source)
        {
            if (source is Guid)
                return (Guid)source;
            if (source is string str)
                return new Guid(str);
            if (source is byte[] bytes)
                return new Guid(bytes);
            throw new NotImplementedException();
        }

        public static object ConvertMany(this IEnumerable source, Type targetType)
        {
            if (source == null)
                return null;
            if (targetType == null)
                throw new InvalidOperationException();
            if (source is string str)
                return Convert(str, targetType);
            if (targetType.IsEnumerable())
            {
                var elementType = targetType.GetItemType();
                var list = new ArrayList();
                foreach (var s in source)
                    list.Add(s);

                return targetType.CreateCollection(list.OfType<object>().Select(e => e.Convert(elementType)).ToArray());
            }

            foreach (var item in source)
                return Convert(item, targetType);

            return null;
        }

        public static object ConvertDictionary(this IDictionary<string, object> dict, Type targetType)
        {
            var valueFactories = dict
                .ToDictionary<KeyValuePair<string, object>, string, Func<Type, object>>(
                    e => e.Key,
                    e => t => e.Value.Convert(t),
                    StringComparer.InvariantCultureIgnoreCase
                );
            return targetType.CreateInstance(valueFactories);
        }
    }
}