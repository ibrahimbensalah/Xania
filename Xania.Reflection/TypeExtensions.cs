using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;

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

        public static bool IsEnumerable(this Type type)
        {
            return type != typeof(string) && typeof(IEnumerable).IsAssignableFrom(type);
        }

        public static object CreateCollection(this Type targetType, params object[] items)
        {
            if (targetType.IsArray)
            {
                return CreateArray(targetType, items);
            }
            if (targetType.IsConcrete())
            {
                return Activator.CreateInstance(targetType);
            }
            var collectionType = typeof(Collection<>).MapTo(targetType) ?? typeof(EnumerableQuery<>).MapTo(targetType);
            if (collectionType != null)
            {
                var elementType = collectionType.GenericTypeArguments[0];
                var arr = Array.CreateInstance(elementType ?? throw new InvalidOperationException(), items.Length);
                Array.Copy(items, arr, items.Length);
                return Activator.CreateInstance(collectionType, arr);
            }
            throw new NotSupportedException($"CreateCollection {targetType.Name}");
        }

        public static object CreateInstance(this Type type, Dictionary<string, Func<Type, object>> properties)
        {
            if (type.IsAnonymousType())
            {
                var ctor = type.GetConstructors().Single();
                var args = ctor.GetParameters().Select(p =>
                {
                    if (properties.TryGetValue(p.Name, out var factory))
                        return factory(p.ParameterType);

                    if (p.HasDefaultValue)
                        return p.DefaultValue;
                    if (p.ParameterType.IsValueType)
                        return Activator.CreateInstance(p.ParameterType);
                    return null;
                }).ToArray();

                return ctor.Invoke(args);
            }
            else
            {
                var instance = Activator.CreateInstance(type);

                foreach (var prop in TypeDescriptor.GetProperties(type).OfType<PropertyDescriptor>())
                {
                    if (properties.TryGetValue(prop.Name, out var value))
                        prop.SetValue(instance, value(prop.PropertyType));
                }

                return instance;
            }
        }

        public static object CreateArray(this Type targetType, object[] content)
        {
            if (targetType.IsArray)
            {
                var elementType = targetType.GetElementType();
                var arr = Array.CreateInstance(elementType ?? throw new InvalidOperationException(), content.Length);
                Array.Copy(content, arr, content.Length);
                return arr;
            }
            throw new NotSupportedException($"CreateCollection {targetType.Name}");
        }

        public static object AddRange(this object collection, object[] items)
        {
            var collectionType = collection.GetType();

            var addMethod =
                collectionType.GetMembers().OfType<MethodInfo>()
                    .Single(m => m.Name.Equals("Add") && m.GetParameters().Length == 1);

            foreach (var item in items)
                addMethod.Invoke(collection, new[] { item });

            return collection;
        }

        private static IEnumerable<Type> GetParentTypes(this Type type)
        {
            if (type.BaseType != null)
                return type.GetInterfaces(false).Concat(new[] { type.BaseType });
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

        public static bool IsAnonymousType(this Type type)
        {
            return type.CustomAttributes.Select(e => e.AttributeType).Contains(typeof(CompilerGeneratedAttribute));
        }

        public static Type GetItemType(this Type enumerableType)
        {
            foreach (var i in enumerableType.GetInterfaces())
            {
                if (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>))
                    return i.GenericTypeArguments[0];
            }
            throw new InvalidOperationException("is not enumerable type " + enumerableType);
        }
    }
}
