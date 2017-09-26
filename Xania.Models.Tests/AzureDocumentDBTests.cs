using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
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
                    store.UpdateAsync(m).Wait();
                }
            }
        }

        [Test]
        public void Setup()
        {
            using (var db = new XaniaDataContext())
            {
                var store = db.Store<Invoice>();
                store.AddAsync(new Invoice
                {
                    Description = "invoice 1",
                    InvoiceNumber = "201701",
                    CompanyId = ToGuid(1)
                }).Wait();
                store.AddAsync(new Invoice
                {
                    Description = "invoice 2",
                    InvoiceNumber = "201702",
                    CompanyId = ToGuid(2),
                    InvoiceDate = DateTime.Now
                }).Wait();
                store.AddAsync(new Invoice
                {
                    Description = "invoice 3",
                    InvoiceNumber = "201703",
                    CompanyId = ToGuid(3),
                    InvoiceDate = DateTime.Now
                }).Wait();
            }
        }
        public static Guid ToGuid(object src)
        {
            return ToGuid(src.ToString());
        }

        public static Guid ToGuid(string src)
        {
            byte[] stringbytes = Encoding.UTF8.GetBytes(src);
            byte[] hashedBytes = SHA1.Create().ComputeHash(stringbytes);
            Array.Resize(ref hashedBytes, 16);
            return new Guid(hashedBytes);
        }
    }
}
