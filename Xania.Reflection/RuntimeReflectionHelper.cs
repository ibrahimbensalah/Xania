using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;

namespace Xania.Reflection
{
    public class RuntimeReflectionHelper : IReflectionHelper
    {
        public Type GetElementType(Type enumerableType)
        {
            foreach (var i in enumerableType.GetInterfaces())
            {
                if (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>))
                    return i.GenericTypeArguments[0];
            }
            throw new InvalidOperationException("is not enumerable type " + enumerableType);
        }

        public TypeInfo CreateType(IDictionary<string, Type> fields)
        {
            TypeBuilder tb = GetTypeBuilder();
            var constructor = tb.DefineDefaultConstructor(MethodAttributes.Public | MethodAttributes.SpecialName |
                                                          MethodAttributes.RTSpecialName);

            foreach (var kvp in fields)
                CreateProperty(tb, kvp.Key, kvp.Value);

            TypeInfo objectTypeInfo = tb.CreateTypeInfo();
            return objectTypeInfo;
        }

        public MethodInfo GetQueryableSelect(Type elementType, Type resultType)
        {
            var expressionType = typeof(Expression<>).MakeGenericType(typeof(Func<,>).MakeGenericType(elementType, resultType));
            return typeof(Queryable)
                .GetRuntimeMethods()
                .Where(e => e.Name.Equals("Select"))
                .Select(e => e.MakeGenericMethod(elementType, resultType))
                .Single(e => e.GetParameters().Any(p => p.ParameterType == expressionType));
        }

        public MethodInfo GetQueryableWhere(Type elementType)
        {
            var expressionType = typeof(Expression<>).MakeGenericType(typeof(Func<,>).MakeGenericType(elementType, typeof(bool)));
            return typeof(Queryable)
                .GetRuntimeMethods()
                .Where(e => e.Name.Equals("Where"))
                .Select(e => e.MakeGenericMethod(elementType))
                .Single(e => e.GetParameters().Any(p => p.ParameterType == expressionType));
        }

        public MethodInfo GetQueryableJoin(Type outerType, Type innerType, Type keyType, Type resultType)
        {
            if (outerType == null) throw new ArgumentNullException(nameof(outerType));
            if (innerType == null) throw new ArgumentNullException(nameof(innerType));
            if (keyType == null) throw new ArgumentNullException(nameof(keyType));
            if (resultType == null) throw new ArgumentNullException(nameof(resultType));

            // Queryable.Join()
            return typeof(Queryable).GetRuntimeMethods()
                .Where(e => e.Name.Equals("Join") && e.GetParameters().Length == 5)
                .Select(e => e.MakeGenericMethod(outerType, innerType, keyType, resultType))
                .Single();
        }

        private static TypeBuilder GetTypeBuilder()
        {
            var typeSignature = "MyDynamicType";
            var an = new AssemblyName(typeSignature);
            var assemblyBuilder = AssemblyBuilder.DefineDynamicAssembly(new AssemblyName(Guid.NewGuid().ToString()), AssemblyBuilderAccess.Run);
            ModuleBuilder moduleBuilder = assemblyBuilder.DefineDynamicModule("MainModule");
            TypeBuilder tb = moduleBuilder.DefineType(typeSignature,
                TypeAttributes.Public |
                TypeAttributes.Class |
                TypeAttributes.AutoClass |
                TypeAttributes.AnsiClass |
                TypeAttributes.BeforeFieldInit |
                TypeAttributes.AutoLayout,
                null);
            return tb;
        }

        private static void CreateProperty(TypeBuilder tb, string propertyName, Type propertyType)
        {
            FieldBuilder fieldBuilder = tb.DefineField("_" + propertyName, propertyType, FieldAttributes.Private);

            PropertyBuilder propertyBuilder = tb.DefineProperty(propertyName, PropertyAttributes.HasDefault, propertyType, null);
            MethodBuilder getPropMthdBldr = tb.DefineMethod("get_" + propertyName, MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig, propertyType, Type.EmptyTypes);
            ILGenerator getIl = getPropMthdBldr.GetILGenerator();

            getIl.Emit(OpCodes.Ldarg_0);
            getIl.Emit(OpCodes.Ldfld, fieldBuilder);
            getIl.Emit(OpCodes.Ret);

            MethodBuilder setPropMthdBldr =
                tb.DefineMethod("set_" + propertyName,
                    MethodAttributes.Public |
                    MethodAttributes.SpecialName |
                    MethodAttributes.HideBySig,
                    null, new[] { propertyType });

            ILGenerator setIl = setPropMthdBldr.GetILGenerator();
            Label modifyProperty = setIl.DefineLabel();
            Label exitSet = setIl.DefineLabel();

            setIl.MarkLabel(modifyProperty);
            setIl.Emit(OpCodes.Ldarg_0);
            setIl.Emit(OpCodes.Ldarg_1);
            setIl.Emit(OpCodes.Stfld, fieldBuilder);

            setIl.Emit(OpCodes.Nop);
            setIl.MarkLabel(exitSet);
            setIl.Emit(OpCodes.Ret);

            propertyBuilder.SetGetMethod(getPropMthdBldr);
            propertyBuilder.SetSetMethod(setPropMthdBldr);
        }
    }

}
