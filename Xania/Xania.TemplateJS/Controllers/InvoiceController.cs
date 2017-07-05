using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;
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

        [HttpGet, Route("{invoiceId:guid}/pdf")]
        public IActionResult GeneratePDF(Guid invoiceId)
        {
            var invoiceData = GetInvoideReportData(invoiceId);
            var reportContents = new InvoiceReport().Generate(invoiceData);
            return File(reportContents, "application/pdf");
        }

        public InvoiceReportDataTO GetInvoideReportData(Guid invoiceId)
        {
            var invoice = _invoiceStore.Single(e => e.Id == invoiceId);

            if (invoice.CompanyId == null || invoice.InvoiceDate == null)
                throw new InvalidOperationException("invoice is not valid");

            var company = _companyStore.Single(e => e.Id == invoice.CompanyId);

            return new InvoiceReportDataTO
            {
                Invoice = new InvoiceTO
                {
                    ExpirationDate = invoice.InvoiceDate.Value + TimeSpan.FromDays(30),
                    InvoiceDate = invoice.InvoiceDate.Value,
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

            await _invoiceStore.UpdateAsync(x => x.Id == invoice.Id, invoice);
            return null;
        }

        [HttpPut, Route("{invoiceId:guid}")]
        public async Task<Invoice> Update(Guid invoiceId, [FromBody]Invoice invoice)
        {
            if (invoice == null)
                throw new NullReferenceException();

            await _invoiceStore.UpdateAsync(x => x.Id == invoiceId, invoice);
            return invoice;
        }

        [HttpPost, Route("{invoiceId:guid}")]
        public Invoice Get(Guid invoiceId)
        {
            return _invoiceStore.SingleOrDefault(e => e.Id == invoiceId);
        }

        [HttpPost]
        [Route("query")]
        public object Query([FromBody]dynamic ast)
        {
            return QueryHelper.accept(ast, new Dictionary<string, object>
            {
                { "invoices", _invoiceStore }
            });
        }

    }
}