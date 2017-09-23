using System;
using Newtonsoft.Json;

namespace Xania.Models
{
    public class Invoice
    {
        public string InvoiceNumber { get; set; }

        public string Description { get; set; }

        public DateTime? InvoiceDate { get; set; }

        public int? CompanyId { get; set; }

        public bool IsClosed { get; set; }

        public TimeSpan Expiration { get; set; } = TimeSpan.FromSeconds(0);

        public HourDeclaration[] Lines { get; set; } = {
            new HourDeclaration { Description = "Item 1", HourlyRate = 75, Hours = 120 },
            new HourDeclaration { Description = "Item 2", HourlyRate = 75, Hours = 20 }
        };
    }
}