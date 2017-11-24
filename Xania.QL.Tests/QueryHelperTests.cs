using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http.Formatting;
using System.Text;
using FluentAssertions;
using NUnit.Framework;
using Xania.QL.Tests.Properties;
using Xania.Models;
using Xania.Reflection;
using Xania.TemplateJS.Reporting;

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

}
