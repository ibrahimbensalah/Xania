using Antlr4.Runtime;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Antlr4.Runtime.Tree;
using FluentAssertions;
using NUnit.Framework;

namespace Xania.Binder.Grammar
{
    [TestFixture]
    public class BinderParserTests
    {
        [Test]
        public static void Test()
        {
            ICharStream input = new AntlrInputStream(new StringReader("@asdfas33.dd.d @asdfasd.f66.hhh"));
            var lex = new BinderLexer(input);
            var tokens = new CommonTokenStream(lex);
            var parser = new BinderParser(tokens);

            var visitor = new MemberExpressionVisitor();
            var binderExpr = parser.binderExpr();
            var memberExpr = binderExpr.GetRuleContext<BinderParser.MemberExprContext>(0).Accept(visitor);

            memberExpr.Property.Should().Be("asdfas33");
            memberExpr.Child.Property.Should().Be("dd");
            memberExpr.Child.Child.Property.Should().Be("d");

            ToJs(memberExpr, Console.Out);

            //Console.WriteLine(parser.binderExpr().ToStringTree(parser));
        }

        private static void ToJs(MemberExpression memberExpr, TextWriter writer)
        {
            var path = memberExpr.Path.ToList();

            writer.Write("get(context, ['" + string.Join("', '", path.Select(p => p.Property)) + "'])");
        }
    }

    public class MemberExpressionVisitor : BinderParserBaseVisitor<MemberExpression>
    {
        public override MemberExpression VisitMemberExpr(BinderParser.MemberExprContext context)
        {
            return new MemberExpression
            {
                Child = GetChildExpression(context),
                Property = context.IDENT_EXPR().Symbol.Text
            };
        }

        private MemberExpression GetChildExpression(BinderParser.MemberExprContext context)
        {
            var memberExpr = context.GetChild<BinderParser.MemberExprContext>(0);
            return memberExpr != null ? memberExpr.Accept(this) : null;
        }
    }

    public class MemberExpression
    {
        public string Property { get; set; }
        public MemberExpression Child { get; set; }

        public IEnumerable<MemberExpression> Path
        {
            get
            {
                yield return this;
                var child = Child;
                while (child != null)
                {
                    yield return child;

                    child = child.Child;
                }
            }
        }
    }
}