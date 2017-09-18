using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Xania.Data.DocumentDB;

namespace Xania.Models.Tests
{
    public class AzureDocumentDBTests
    {
        [Test]
        public void DocumentDemoTest()
        {
            using (var db = new XaniaDataContext())
            {
                var collection = db.Store<Invoice>();
                foreach (var m in collection)
                {
                    Console.WriteLine($"{m.Id} {m.Lines[0].Description}");
                }
            }
        }
    }
}
