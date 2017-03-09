using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class InvoiceController
    {
        private readonly IObjectStore<Invoice> _invoices;

        public InvoiceController(IObjectStore<Invoice> invoices)
        {
            _invoices = invoices;
        }

        [HttpPost]
        public async Task<User> Add([FromBody]Invoice invoice)
        {
            await _invoices.SaveAsync(x => x.Id == invoice.Id, invoice);
            return null;
        }

        [HttpPost]
        [Route("query")]
        public object Query([FromBody]dynamic ast)
        {
            return QueryHelper.accept(ast, new Dictionary<string, object>
            {
                { "invoices", _invoices }
            });
        }
    }

    public class Invoice
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Description { get; set; }

        public DateTime? InvoiceDate { get; set; } = DateTime.Now;

        public InvoiceItem[] Lines { get; set; }
    }

    public class InvoiceItem
    {
        public string Description { get; set; }
        public decimal Amount { get; set; }
    }
}
