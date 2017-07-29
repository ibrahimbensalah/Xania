using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;
using Xania.QL;
using Xania.TemplateJS.Reporting;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class XaniaDbController: Controller
    {
        private readonly QueryContext _storeContext;

        public XaniaDbController(IObjectStore<Invoice> invoiceStore, IObjectStore<Company> companyStore)
        {
            _storeContext = new QueryContext()
                .Add("companies", companyStore.AsQueryable())
                .Add("invoices", invoiceStore.AsQueryable());
        }

        [HttpPost]
        [Route("")]
        public Task<dynamic> Index([FromBody] dynamic ast)
        {
            return Task.Run(() =>
            {
                var requestContext = new QueryContext()
                    .Add("now", DateTime.Now)
                    .Add("server", new { host = Request.Host.Value })
                    .Add("user", User);

                var queryHelper = new QueryHelper(new RuntimeReflectionHelper());
                return Json(queryHelper.Execute(ast, _storeContext, requestContext));
            });
        }
    }

    internal class RuntimeReflectionHelper : IReflectionHelper
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


        private static readonly IDictionary<TypeDesc, TypeInfo> _anonymousTypes = new Dictionary<TypeDesc, TypeInfo>();
        private static readonly object _lockObject = new object();

        public TypeInfo CreateType(IDictionary<string, Type> fields)
        {
            lock (_lockObject)
            {
                var key = new TypeDesc(fields);

                TypeInfo result;
                if (_anonymousTypes.TryGetValue(key, out result))
                    return result;

                TypeBuilder tb = GetTypeBuilder();

                foreach (var kvp in fields)
                    CreateProperty(tb, kvp.Key, kvp.Value);

                TypeInfo objectTypeInfo = tb.CreateTypeInfo();

                _anonymousTypes.Add(key, objectTypeInfo);
                return objectTypeInfo;
            }
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

        public MethodInfo GetQueryableJoin(Type outerType, Type innerType, Type keyType, Type resultType)
        {
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

    internal class TypeDesc
    {
        private readonly IDictionary<string, Type> _fields;

        public TypeDesc(IDictionary<string, Type> fields)
        {
            _fields = fields;
        }

        public override int GetHashCode()
        {
            var hash = 0;
            foreach (var kvp in _fields)
            {
                hash += kvp.Key.GetHashCode() + kvp.Value.GetHashCode();
            }
            return hash;
        }

        public override bool Equals(object obj)
        {
            var other = obj as TypeDesc;
            if (other == null) return false;

            return DictionaryEqual(this._fields, other._fields);
        }

        public static bool DictionaryEqual<TKey, TValue>(IDictionary<TKey, TValue> first, IDictionary<TKey, TValue> second,
            IEqualityComparer<TValue> valueComparer = null)
        {
            if (first == second) return true;
            if ((first == null) || (second == null)) return false;
            if (first.Count != second.Count) return false;

            valueComparer = valueComparer ?? EqualityComparer<TValue>.Default;

            foreach (var kvp in first)
            {
                TValue secondValue;
                if (!second.TryGetValue(kvp.Key, out secondValue)) return false;
                if (!valueComparer.Equals(kvp.Value, secondValue)) return false;
            }
            return true;
        }
    }

    public class Store
    {
        private readonly IDictionary<string, object> _values;

        public Store(IDictionary<string, object> values)
        {
            _values = values;
        }
        public object Get(string name)
        {
            object value;
            return _values.TryGetValue(name, out value) ? value : null;
        }
    }

    public enum ExpressionType
    {
        WHERE = 1,
        QUERY = 2,
        IDENT = 3,
        MEMBER = 4,
        APP = 5,
        SELECT = 6,
        CONST = 7,
        RANGE = 8,
        BINARY = 9,
        AWAIT = 10,
        PIPE = 11,
        COMPOSE = 12,
        LAMBDA = 13
    }
}

