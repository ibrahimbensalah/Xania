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

        public static bool IsPrimitive(this Type type)
        {
            return type.IsPrimitive || type == typeof(string) || type == typeof(DateTimeOffset) || type == typeof(DateTime) || type.IsEnum || type == typeof(Guid);
        }

        public static bool IsComplexType(this Type type)
        {
            return type.IsValueType || type.CustomAttributes.Any(e => e.AttributeType.Name.Equals("ComplexTypeAttribute"));
        }

        public static bool IsConcrete(this Type type)
        {
            return !(type.IsInterface || type.IsAbstract || type.GetConstructors().Length == 0);
        }

        public static Type MapFrom(this Type templateType, Type targetType)
        {
            if (targetType.ContainsGenericParameters)
                return null;

            var stack = new Stack<Type>();
            stack.Push(targetType);

            while (stack.Count > 0)
            {
                var type = stack.Pop();
                if (type.IsGenericType && type.GetGenericTypeDefinition() == templateType)
                    return type;

                if (type.BaseType != null)
                    stack.Push(type.BaseType);

                foreach(var i in type.GetInterfaces())
                    stack.Push(i);
            }

            return null;
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

            foreach (var parentTpl in templateType.GetParentTypes())
            {
                if (parentTpl.IsTemplateTypeOf(targetType))
                {
                    var gtmap = parentTpl.GenericTypeArguments.Select((gt, idx) => new { gt, t = targetType.GenericTypeArguments[idx] });
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
            if (type == typeof(string))
                return false;

            return typeof(IEnumerable).IsAssignableFrom(type) || type.IsArray;
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

        public static object CreateInstance(this Type type, IDictionary<string, object> properties)
        {
            var factories = properties.ToDictionary<KeyValuePair<string, object>, string, Func<Type, object>>(kvp => kvp.Key, kvp => t => kvp.Value.Convert(t));
            return CreateInstance(type, factories);
        }

        public static object CreateInstance(this Type type, IDictionary<string, Func<Type, object>> properties)
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

            {
                var instance = Activator.CreateInstance(type.GetKnownConcrete());

                foreach (var prop in TypeDescriptor.GetProperties(type).OfType<PropertyDescriptor>())
                {
                    if (properties.TryGetValue(prop.Name, out var value))
                    {
                        var newValue = value(prop.PropertyType);
                        if (prop.IsReadOnly)
                        {
                            var existingValue = prop.GetValue(instance);
                            if (existingValue != null)
                            {
                                if (newValue is IEnumerable enumerable)
                                    existingValue.AddRange(OfType(enumerable, prop.PropertyType.GetItemType()).ToArray());
                            }
                        }
                        else
                        {
                            prop.SetValue(instance, newValue);
                        }
                    }
                }

                return instance;
            }
        }

        public static Type GetKnownConcrete(this Type type)
        {
            return typeof(Collection<>).MapTo(type) ?? type;
        }


        private static IEnumerable<object> OfType(IEnumerable objects, Type elementType)
        {
            var ofType = typeof(Enumerable).GetMethod("OfType")?.MakeGenericMethod(elementType);
            return (IEnumerable<object>)ofType?.Invoke(null, new object[] { objects });
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
            throw new NotSupportedException($"CreateArray {targetType.Name}");
        }

        public static object AddRange(this object collection, IEnumerable<object> items)
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
