using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Xania.QL;
using Xunit;

namespace XUnitTestProject1
{
    public class UnitTest1
    {
        private readonly QueryHelper _helper = new QueryHelper(new RuntimeReflectionHelper());

        [Fact]
        public void Test1()
        {
            var options = new DbContextOptionsBuilder<TestDbContext>()
                .UseInMemoryDatabase(databaseName: "Add_writes_to_database")
                .Options
                ;

            using (var db = new TestDbContext(options))
            {
                var context = new QueryContext
                {
                    {"companies", db.Companies},
                    {"invoices", db.Invoices}
                };


                var join = GetJoin(
                    outer: GetQuery("i", GetIdentifier("invoices")),
                    inner: GetQuery("c", GetIdentifier("companies")),
                    conditions: new[]
                    {
                        GetJoinCondition(GetMember(GetIdentifier("i"), "CompanyId"), GetMember(GetIdentifier("c"), "Id"))
                    });

                var record = GetRecord(
                    GetMemberBind("invoiceId", GetMember(GetIdentifier("i"), "Id")),
                    GetMemberBind("companyName", GetMember(GetIdentifier("c"), "Name")));
                var ast = GetSelector(join, record);
                var expr = _helper.ToLinq(ast, context);
                var result = Invoke<IQueryable<dynamic>>(expr).ToArray();
            }
        }

        private object GetJoinCondition(object outerKey, object innerKey)
        {
            dynamic ast = new ExpandoObject();
            ast.outerKey = outerKey;
            ast.innerKey = innerKey;
            return ast;
        }

        private object GetEqual(object left, object right)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.BINARY;
            ast.op = Token.EQ;
            ast.left = left;
            ast.right = right;
            return ast;
        }

        private object GetRecord(params object[] binders)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.RECORD;
            ast.binders = binders;
            return ast;
        }

        private object GetMemberBind(string name, object value)
        {
            dynamic ast = new ExpandoObject();
            ast.name = name;
            ast.value = value;
            return ast;
        }

        private static T Invoke<T>(Expression expr)
        {
            return Expression.Lambda<Func<T>>(expr).Compile().Invoke();
        }

        private static object GetIdentifier(string name)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.IDENT;
            ast.name = name;
            return ast;
        }

        private static object GetMember(object target, string name)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.MEMBER;
            ast.target = target;
            ast.name = name;
            return ast;
        }


        private static object GetJoin(object outer, object inner, object[] conditions)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.JOIN;
            ast.outer = outer;
            ast.inner = inner;
            ast.conditions = conditions;
            return ast;
        }

        private static object GetQuery(string param, object source)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.QUERY;
            ast.param = param;
            ast.source = source;
            return ast;
        }

        private static object GetSelector(object query, object selector)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.SELECT;
            ast.selector = selector;
            ast.query = query;
            return ast;
        }

    }

    public class TestDbContext: DbContext
    {
        public TestDbContext(DbContextOptions<TestDbContext> options)
            : base(options)
        {
        }

        public DbSet<Person> People { get; set; }
    }

    public class Person
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
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

        public Type CreateType(IDictionary<string, Type> fields)
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
}
