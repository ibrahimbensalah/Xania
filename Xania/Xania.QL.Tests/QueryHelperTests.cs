﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http.Formatting;
using System.Reflection;
using System.Reflection.Emit;
using System.Text;
using FluentAssertions;
using NUnit.Framework;
using Xania.QL.Tests.Properties;
using Xania.TemplateJS.Reporting;

namespace Xania.QL.Tests
{
    public class QueryHelperTests
    {
        private readonly IEnumerable<Invoice> _invoiceStore = new[]
        {
            new Invoice {CompanyId = 1, Id = Guid.NewGuid()}
        };

        private readonly IEnumerable<Company> _companyStore = new[]
        {
            new Company {Id = 1, Name = "Xania BV"}
        };

        private readonly QueryHelper _helper = new QueryHelper(new RuntimeReflectionHelper());

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
            ((Guid)result[0].invoiceId).Should().Be(invoice.Id);
            ((string)result[0].companyName).Should().Be("Xania BV");
        }

        [Test]
        public void SelectTest()
        {
            var context = new QueryContext
            {
                {"companies", new[] {new Company {Id = 1, Name = "Xania"}}.AsQueryable()}
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
                {"c", new Company {Id = 1, Name = "Xania"}}
            };

            var expr = _helper.ToLinq(GetIdentifier("c"), context);
            var company = Invoke<Company>(expr);
            company.Name.Should().Be("Xania");
            company.Id.Should().Be(1);
        }

        [Test]
        public void MemberTest()
        {
            var context = new QueryContext
            {
                {"c", new Company {Id = 1, Name = "Xania"}}
            };

            var expr = _helper.ToLinq(GetMember(GetIdentifier("c"), "Name"), context);
            var result = Invoke<string>(expr);
            result.Should().Be("Xania");
        }

        [Test]
        public void RecordTest()
        {
            var invoiceId = Guid.NewGuid();
            var context = new QueryContext
            {
                {"c", new Company {Id = 1, Name = "Xania"}},
                {"i", new Invoice {CompanyId = 1, InvoiceNumber = "2017001", Id = invoiceId}}
            };

            var record = GetRecord(GetMemberBind("invoiceId", GetMember(GetIdentifier("i"), "Id")),
                GetMemberBind("companyName", GetMember(GetIdentifier("c"), "Name")));
            var expr = _helper.ToLinq(record, context);
            var result = Invoke<dynamic>(expr);
            ((Guid)result.invoiceId).Should().Be(invoiceId);
            ((string)result.companyName).Should().Be("Xania");
        }

        [Test]
        public void ConditionTest()
        {
            var context = new QueryContext
            {
                {"c", new Company {Id = 1, Name = "Xania"}},
                {"i", new Invoice {CompanyId = 1, InvoiceNumber = "2017001"}}
            };

            var equal = GetEqual(GetMember(GetIdentifier("c"), "Id"), GetMember(GetIdentifier("i"), "CompanyId"));
            var expr = _helper.ToLinq(equal, context);
            var result = Invoke<bool>(expr);
            result.Should().BeTrue();
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

        private static dynamic GetAst(Stream memoryStream)
        {
            var formatter = new JsonMediaTypeFormatter();
            dynamic ast = formatter.ReadFromStream(typeof(object), memoryStream, Encoding.UTF8, null);
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

    class QueryContext : Dictionary<string, object>, IContext
    {
        public QueryContext()
            : base(StringComparer.OrdinalIgnoreCase)
        {
        }

        public Expression Get(string name)
        {
            object value;
            return TryGetValue(name, out value)
                ? Expression.Constant(value)
                : throw new KeyNotFoundException(name);
        }
    }
}
