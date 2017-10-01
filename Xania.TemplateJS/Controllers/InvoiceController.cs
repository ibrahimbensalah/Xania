using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http.Formatting;
using System.Reflection;
using System.Reflection.Emit;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;
using Xania.Models;
using Xania.QL;
using Xania.TemplateJS.Reporting;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class InvoiceController : Controller
    {
        private readonly IObjectStore<Invoice> _invoiceStore;
        private readonly IObjectStore<Company> _companyStore;

        public InvoiceController(IObjectStore<Invoice> invoiceStore, IObjectStore<Company> companyStore)
        {
            _invoiceStore = invoiceStore;
            _companyStore = companyStore;
        }

        [HttpGet, Route("{invoiceNumber}/pdf")]
        public IActionResult GeneratePDF(string invoiceNumber)
        {
            var invoiceData = GetInvoiceReportData(invoiceNumber);
            var reportContents = new InvoiceReport().Generate(invoiceData);
            return File(reportContents, "application/pdf");
        }

        public InvoiceReportDataTO GetInvoiceReportData(string invoiceNumber)
        {
            var invoice = _invoiceStore.Single(e => e.InvoiceNumber.Equals(invoiceNumber, StringComparison.OrdinalIgnoreCase));

            if (invoice.CompanyId == null)
                throw new InvalidOperationException("invoice is not valid");

            var company = _companyStore.Single(e => e.Id == invoice.CompanyId);
            var invoiceDate = invoice.InvoiceDate ?? DateTime.UtcNow;

            return new InvoiceReportDataTO
            {
                Invoice = new InvoiceTO
                {
                    ExpirationDate = invoiceDate + TimeSpan.FromDays(30),
                    InvoiceDate = invoiceDate,
                    InvoiceNumber = invoice.InvoiceNumber,
                    LineItems = from l in invoice.Lines
                        select new LineItemTO
                        {
                            Count = l.Hours,
                            Description = l.Description,
                            Tax = 0.21m,
                            UnitPrice = l.HourlyRate
                        },
                    Description = invoice.Description
                },
                Company = new CompanyTO
                {
                    Id = 1,
                    LogoImageId = 1,
                    AddressLines = new[]
                    {
                        "t.n.v " + company.Address.FullName + "\n",
                        company.Name,
                        string.Join("\r\n", company.Address.Lines.Where(e => e.Type != AddressType.ZipCode).Select(e => e.Value)),
                        company.Address.Lines.Where(e => e.Type == AddressType.ZipCode).Select(e => e.Value).SingleOrDefault() + ", "+ company.Address.Location,
                        "Nederland"
                    },
                    Name = company.Name
                },
                Sender = new SenderTO
                {
                    Name = "Xania Software",
                    BankAccount = "NL61 INGB 0005 8455 00"
                }
            };
        }

        [HttpPost]
        public async Task<Invoice> Add([FromBody]Invoice invoice)
        {
            if (invoice == null)
                throw new NullReferenceException();

            await _invoiceStore.AddAsync(invoice);
            return null;
        }

        [HttpPut, Route("{invoiceNumber}")]
        public async Task<Invoice> Update(string invoiceNumber, [FromBody]Invoice invoice)
        {
            if (invoice == null)
                throw new NullReferenceException();

            await _invoiceStore.UpdateAsync(invoice);
            return invoice;
        }

        [HttpPost, Route("{invoiceNumber}")]
        public Invoice Get(string invoiceNumber)
        {
            return 
                _invoiceStore.FirstOrDefault(x => string.Equals(x.InvoiceNumber, invoiceNumber, StringComparison.OrdinalIgnoreCase))
                ;
        }

        [HttpPut, Route("{invoiceNumber}/close")]
        public async Task<Invoice> Close(string invoiceNumber, [FromBody]Invoice invoice)
        {
            invoice.InvoiceDate = DateTime.UtcNow;
            await _invoiceStore.UpdateAsync(invoice);

            return invoice;
        }

        [HttpPost]
        [Route("query")]
        public object Query([FromBody]dynamic ast)
        {
            return QueryHelper.accept(ast, new Dictionary<string, object>
            {
                { "invoices", _invoiceStore },
                { "companies", _companyStore }
            });
        }
    }
}