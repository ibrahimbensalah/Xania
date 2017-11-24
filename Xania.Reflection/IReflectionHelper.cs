using System;
using System.Collections.Generic;
using System.Reflection;

namespace Xania.Reflection
{
    public interface IReflectionHelper
    {
        Type GetElementType(Type type);
        TypeInfo CreateType(IDictionary<string, Type> fields);
        MethodInfo GetQueryableSelect(Type elementType, Type resultType);
        MethodInfo GetQueryableWhere(Type elementType);
        MethodInfo GetQueryableJoin(Type outerType, Type innerType, Type keyType, Type resultType);
    }
}