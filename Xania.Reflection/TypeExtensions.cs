using System;
using System.Collections.Generic;
using System.Linq;

namespace Xania.Reflection
{
    public static class TypeExtensions
    {
        public static IEnumerable<Type> GetInterfaces(this Type type, bool includeInherited)
        {
            if (includeInherited || type.BaseType == null)
                return type.GetInterfaces();
            if (type.BaseType != null)
                return type.GetInterfaces().Except(type.BaseType.GetInterfaces());
            return Enumerable.Empty<Type>();
        }

        public static bool IsConcrete(this Type type)
        {
            return !(type.IsInterface || type.IsAbstract || type.GetConstructors().Length == 0);
        }


        public static Type MapTo(this Type templateType, Type targetType)
        {
            if (targetType.ContainsGenericParameters)
                return null;

            if (targetType == templateType || targetType.IsAssignableFrom(templateType))
                return templateType;

            if (!templateType.ContainsGenericParameters)
                return null;

            if (targetType.IsGenericType && targetType.GetGenericTypeDefinition() == templateType)
                return targetType;

            foreach (var i in templateType.GetParentTypes())
            {
                if (i.IsTemplateTypeOf(targetType))
                {
                    var gtmap = i.GenericTypeArguments.Select((gt, idx) => new { gt, t = targetType.GenericTypeArguments[idx] });
                    var args =
                        from a in templateType.GetGenericArguments()
                        join b in gtmap on a equals b.gt into j
                        from c in j.DefaultIfEmpty()
                        select c.t ?? a;
                    var arr = args.ToArray();
                    return templateType.GetGenericTypeDefinition().MakeGenericType(arr);
                }
            }

            if (templateType.BaseType != null)
            {
                var type = templateType.BaseType.MapTo(targetType);
                if (type != null)
                    return templateType.MapTo(type);
            }
            return null;
        }

        private static IEnumerable<Type> GetParentTypes(this Type type)
        {
            if (type.BaseType != null)
                return type.GetInterfaces(false).Concat(new[] { type.BaseType });
            else
                return type.GetInterfaces(false);
        }

        private static bool IsTemplateTypeOf(this Type templateType, Type targetType)
        {
            if (!templateType.ContainsGenericParameters)
                return targetType.IsAssignableFrom(templateType);
            if (targetType.IsGenericType)
                return templateType.GetGenericTypeDefinition() == targetType.GetGenericTypeDefinition();
            return false;
        }
    }
}
