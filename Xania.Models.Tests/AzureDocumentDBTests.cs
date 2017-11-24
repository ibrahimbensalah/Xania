﻿using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using NUnit.Framework;
using Xania.Data.DocumentDB;

namespace Xania.Models.Tests
{
    [Ignore("Documents obsolete in favor of graphs")]
    public class AzureDocumentDBTests
    {
        const string EndpointUrl = "https://xania-sql.documents.azure.com:443/";
        const string PrimaryKey = "xiq9QJQ2naMaqrkbWlu5yxL8N3PTIST0dJuwjHqsei1psDvdGGWfEsGO9I0dP3HuJvXbMXjle4galX0VrcV0FA==";

        [Test]
        public void DocumentDemoTest()
        {
            using (var db = new XaniaDataContext(EndpointUrl, PrimaryKey))
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
            using (var db = new XaniaDataContext(EndpointUrl, PrimaryKey))
            {
                var invoiceStore = db.Store<Invoice>();
                invoiceStore.AddAsync(new Invoice
                {
                    Id = ToGuid(4),
                    Description = "invoice 1",
                    InvoiceNumber = "201701",
                    CompanyId = ToGuid(1)
                }).Wait();
                invoiceStore.AddAsync(new Invoice
                {
                    Id = ToGuid(5),
                    Description = "invoice 2",
                    InvoiceNumber = "201702",
                    CompanyId = ToGuid(2),
                    InvoiceDate = DateTime.Now
                }).Wait();
                invoiceStore.AddAsync(new Invoice
                {
                    Id = ToGuid(6),
                    Description = "invoice 3",
                    InvoiceNumber = "201703",
                    CompanyId = ToGuid(3),
                    InvoiceDate = DateTime.Now
                }).Wait();

                var companyStore = db.Store<Company>();
                companyStore.AddAsync(new Company
                {
                    Address = new Address
                    {
                        FullName = "Ibrahim ben Salah",
                        Location = "Amsterdam",
                        Lines =
                        {
                            new AddressLine { Type = AddressType.Street, Value = "Punter 315 "}
                        }
                    },
                    Id = ToGuid(1),
                    Name = "Xania Software"
                }).Wait();
                companyStore.AddAsync(new Company
                {
                    Address = new Address
                    {
                        FullName = "Edi Gittenberger",
                        Location = "Amsterdam",
                        Lines =
                        {
                            new AddressLine { Type = AddressType.Street, Value = "Sijsjesbergweg 42"},
                            new AddressLine { Type = AddressType.ZipCode, Value = "1105 AL"}
                        }
                    },
                    Id = ToGuid(2),
                    Name = "Rider International BV"
                }).Wait();
                companyStore.AddAsync(new Company
                {
                    Address = new Address
                    {
                        FullName = "Jan Piet",
                        Location = "Amsterdam",
                        Lines =
                        {
                            new AddressLine { Type = AddressType.Street, Value = "WTC 123"}
                        }
                    },
                    Id = ToGuid(3),
                    Name = "Darwin Recruitement"
                }).Wait();
            }
        }

        [Test]
        public void DeleteAllInvoices()
        {
            using (var db = new XaniaDataContext(EndpointUrl, PrimaryKey))
            {
                db.Store<Invoice>().DeleteAsync(invoice => true).Wait();
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
