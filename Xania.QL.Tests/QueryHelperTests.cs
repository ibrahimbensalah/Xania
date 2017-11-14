using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http.Formatting;
using System.Reflection;
using System.Reflection.Emit;
using FluentAssertions;
using NUnit.Framework;
using Xania.QL.Tests.Properties;
using Xania.Models;

namespace Xania.QL.Tests
{
    public class QueryHelperTests
    {
        private readonly IEnumerable<Invoice> _invoiceStore = new[]
        {
            new Invoice {CompanyId = 1.ToGuid()}
        };

        private readonly IEnumerable<Company> _companyStore = new[]
        {
            new Company {Id = 1.ToGuid(), Name = "Xania BV"}
        };

        private readonly QueryHelper _helper = new QueryHelper(new RuntimeReflectionHelper());

        [TestCase("join")]
        [TestCase("join2")]
        public void ResourceTest(string resourceName)
        {
            IContext context = new QueryContext
            {
                {"companies", (_companyStore.AsQueryable())},
                {"invoices", (_invoiceStore.AsQueryable())}
            };

            var ast = GetAstFromResource(resourceName);
            var expr = _helper.ToLinq(ast, context);
            var result = new List<dynamic>(Invoke<IQueryable<dynamic>>(expr));

            var invoice = _invoiceStore.Single();
            ((string)result[0].invoiceNumber).Should().Be(invoice.InvoiceNumber);
            ((string)result[0].companyName).Should().Be("Xania BV");
        }

        private static dynamic GetAstFromResource(string resourceName)
        {
            var data = (byte[]) Resources.ResourceManager.GetObject(resourceName, Resources.Culture);
            Debug.Assert(data != null, "data != null");
            var ast = GetAst(new MemoryStream(data), Encoding.Default);
            return ast;
        }

        [Test]
        public void NegationTest()
        {
            var context = new QueryContext()
                .Add("user", new { IsAuthenticated = false });

            var negate = GetNot(GetMember(GetIdentifier("user"), "isAuthenticated"));
            bool result = _helper.Execute(negate, context);

            result.Should().BeTrue();
        }

        [Test]
        public void JoinTest()
        {
            var context = new QueryContext
            {
                {"companies", _companyStore.AsQueryable()},
                {"invoices", _invoiceStore.AsQueryable()}
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

            var invoice = _invoiceStore.Single();
            ((string)result[0].invoiceNumber).Should().Be(invoice.InvoiceNumber);
            ((string)result[0].companyName).Should().Be("Xania BV");
        }

        [Test]
        public void SelectTest()
        {
            var context = new QueryContext
            {
                {"companies", new[] {new Company {Id = 1.ToGuid(), Name = "Xania"}}.AsQueryable()}
            };

            var ast = GetSelector(GetQuery("c", GetIdentifier("companies")), GetMember(GetIdentifier("c"), "Name"));
            var expr = _helper.ToLinq(ast, context);
            var companies = Invoke<IEnumerable<string>>(expr).ToArray();

            companies[0].Should().Be("Xania");
        }

        [Test]
        public void IdentifierTest()
        {
            var context = new QueryContext
            {
                {"c", new Company {Id = 1.ToGuid(), Name = "Xania"}}
            };

            var expr = _helper.ToLinq(GetIdentifier("c"), context);
            var company = Invoke<Company>(expr);
            company.Name.Should().Be("Xania");
            company.Id.Should().Be(1.ToGuid());
        }

        [Test]
        public void MemberTest()
        {
            var context = new QueryContext
            {
                {"c", (new Company {Id = 1.ToGuid(), Name = "Xania"})}
            };

            var expr = _helper.ToLinq(GetMember(GetIdentifier("c"), "Name"), context);
            var result = Invoke<string>(expr);
            result.Should().Be("Xania");
        }

        [Test]
        public void RecordTest()
        {
            var context = new QueryContext
            {
                {"c", (new Company {Id = 1.ToGuid(), Name = "Xania"})},
                {"i", (new Invoice {CompanyId = 1.ToGuid(), InvoiceNumber = "2017001"})}
            };

            var record = GetRecord(GetMemberBind("invoiceId", GetMember(GetIdentifier("i"), "Id")),
                GetMemberBind("companyName", GetMember(GetIdentifier("c"), "Name")));
            var expr = _helper.ToLinq(record, context);
            var result = Invoke<dynamic>(expr);
            ((string)result.invoiceNumber).Should().Be("2017001");
            ((string)result.companyName).Should().Be("Xania");
        }

        [Test]
        public void ConditionTest()
        {
            var context = new QueryContext
            {
                {"c", new Company {Id = 1.ToGuid(), Name = "Xania"}},
                {"i", new Invoice {CompanyId = 1.ToGuid(), InvoiceNumber = "2017001"}}
            };

            var equal = GetEqual(GetMember(GetIdentifier("c"), "Id"), GetMember(GetIdentifier("i"), "CompanyId"));
            var expr = _helper.ToLinq(equal, context);
            var result = Invoke<bool>(expr);
            result.Should().BeTrue();
        }

        [Test]
        public void WhereTest()
        {
            var companies = new[]
            {
                new Company {Id = 1.ToGuid(), Name = "Xania"},
                new Company {Id = 2.ToGuid(), Name = "Rider"},
                new Company {Id = 3.ToGuid(), Name = "Rabo"}
            };
            var context = new QueryContext
            {
                {"companies", companies.AsQueryable()}
            };

            var ast = GetAstFromResource("where");
            var linq = _helper.ToLinq(ast, context);
            IQueryable<Company> result = Invoke<IQueryable<Company>>(linq);
            result.Count().Should().Be(1);
        }

        private object GetConst(object value)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.CONST;
            ast.value = value;
            return ast;
        }

        private object GetWhere(object left, object right)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.WHERE;
            ast.left = left;
            ast.right = right;
            return ast;
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

        private static object GetMember(object target, string member)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.MEMBER;
            ast.target = target;
            ast.member = member;
            return ast;
        }

        private object GetApp(object fun, params object[] args)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.APP;
            ast.fun = fun;
            ast.args = args;
            return ast;
        }

        private object GetNot(object expr)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.NOT;
            ast.expr = expr;
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

        private static object GetSelector(object source, object selector)
        {
            dynamic ast = new ExpandoObject();
            ast.type = Token.SELECT;
            ast.selector = selector;
            ast.source = source;
            return ast;
        }

        private static dynamic GetAst(Stream memoryStream, Encoding encoding)
        {
            var formatter = new JsonMediaTypeFormatter();
            dynamic ast = formatter.ReadFromStream(typeof(object), memoryStream, encoding, null);
            return ast;
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
