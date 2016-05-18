using Antlr4.Runtime;
using System;
using System.IO;
using Antlr4.Runtime.Tree;
using NUnit.Framework;

namespace Xania.Binder.Grammar
{
    [TestFixture]
    public class BinderParserTests
    {
        [Test]
        public static void Test()
        {
            ICharStream input = new AntlrInputStream(new StringReader("@asdfas33.ddd @asdfasd.f66.hhh"));
            var lex = new BinderLexer(input);
            var tokens = new CommonTokenStream(lex);
            var parser = new BinderParser(tokens);

            Console.WriteLine(parser.binderExpr().ToStringTree(parser));
            Console.WriteLine(parser.binderExpr().ToStringTree(parser));
        }
    }
}