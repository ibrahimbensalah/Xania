using System;
using System.Collections.Generic;
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

        public string InvoiceNumber { get; set; }

        public string Description { get; set; }

        public DateTime? InvoiceDate { get; set; }

        public int? CompanyId { get; set; }

        public HourDeclaration[] Lines { get; set; } = {
            new HourDeclaration { Description = "Item 1", HourlyRate = 75, Hours = 120 },
            new HourDeclaration { Description = "Item 2", HourlyRate = 75, Hours = 20 }
        };
    }

    public class HourDeclaration
    {
        public string Description { get; set; }
        public decimal HourlyRate { get; set; }
        public float Hours { get; set; }
    }
}