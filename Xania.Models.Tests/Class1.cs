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
                db.Main();
            }
        }
    }
}
