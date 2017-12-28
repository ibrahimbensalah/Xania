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

            if (targetType == typeof(Guid))
                return ConvertToGuid(source);

            if (!(source is string) && source is IEnumerable enumerable)
                return Convert(enumerable, targetType);

            //var value = typeof(string) != modelProperty.PropertyType &&
            //            typeof(IEnumerable).IsAssignableFrom(modelProperty.PropertyType)
            //    ? values.ToArray()
            //    : values.SingleOrDefault();

            if (targetType.IsEnumerable())
            {
                return targetType.CreateCollection(source);
            }

            try
            {
                return System.Convert.ChangeType(source, targetType);
            }
            catch
            {
                return Activator.CreateInstance(targetType);
            }
        }

        private static Guid ConvertToGuid(object source)
        {
            if (source is Guid)
                return (Guid) source;
            if (source is string str)
                return new Guid(str);
            if (source is byte[] bytes)
                return new Guid(bytes);
            throw new NotImplementedException();
        }

        public static object Convert(this IEnumerable source, Type targetType)
        {
            if (source == null)
                return null;
            if (targetType == null)
                throw new InvalidOperationException();
            if (source is string str)
                return Convert(str as object, targetType);
            if (targetType.IsEnumerable())
            {
                var list = new ArrayList();
                foreach (var s in source)
                    list.Add(s);

                return targetType.CreateCollection(list.ToArray());
            }

            foreach(var item in source)
                return Convert(item, targetType);

            return null;
        }
    }
}