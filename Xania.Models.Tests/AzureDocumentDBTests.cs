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
                var store = db.Store<Invoice>();

                store.AddAsync(new Invoice {Description = "test item"}).Wait();

                var queryable = store.Query().Where(e => e.Description.Equals("test item"));
                Console.WriteLine(queryable.ToString());

                foreach (var m in queryable)
                {
                    Console.WriteLine($"{m.InvoiceNumber} {m.Lines[0].Description}");
                    m.Description = "test item 2";
                    store.UpdateAsync(e => e.InvoiceNumber.Equals(m.InvoiceNumber, StringComparison.OrdinalIgnoreCase), m).Wait();
                }

            }
        }
    }
}
