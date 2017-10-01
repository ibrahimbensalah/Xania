using System;
using System.Collections.Generic;
using System.Linq;

namespace Xania.TemplateJS.Reporting
{
    public class InvoiceReportDataTO
    {
        public InvoiceTO Invoice { get; set; }
        public CompanyTO Company { get; set; }
        public SenderTO Sender { get; set; }
    }

    public class SenderTO
    {
        public string BankAccount { get; set; }
        public string Name { get; set; }
    }

    public class InvoiceTO
    {
        public string InvoiceNumber { get; set; }

        public DateTimeOffset ExpirationDate { get; set; }

        public DateTimeOffset InvoiceDate { get; set; }

        public decimal TotalTax { get { return LineItems.Sum(e => (decimal)e.Count * e.UnitPrice * e.Tax); } }

        public decimal TotalAmountInclTax => TotalAmountExclTax + TotalTax;

        public decimal TotalAmountExclTax { get { return LineItems.Sum(e => (decimal)e.Count * e.UnitPrice); } }

        public string Description { get; set; }

        public IEnumerable<LineItemTO> LineItems { get; set; }
    }

    public class InvoiceListTO
    {

        public string InvoiceNumber { get; set; }

        public DateTimeOffset InvoiceDate { get; set; }

        public DateTimeOffset ExpirationDate { get; set; }

        public string CompanyName { get; set; }
    }

    public class LineItemTO
    {
        public int? Id { get; set; }
        public String Description { get; set; }
        public Decimal UnitPrice { get; set; }
        public Decimal Tax { get; set; }
        public float Count { get; set; }
    }
    public class CompanyTO
    {
        public int? Id { get; set; }
        public String Name { get; set; }
        public AddressTO MainAddress { get; set; }
        public int? LogoImageId { get; set; }
        public string[] AddressLines { get; set; }
    }

    public class CompanyListTO
    {
        public int Id { get; set; }
        public string CompanyName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string ContactName { get; set; }
    }
    public class AddressTO
    {
        public String ContactName { get; set; }
        public String Phone { get; set; }
        public String Email { get; set; }
        public String Street { get; set; }
        public String Nr { get; set; }
        public String NrExtra { get; set; }
        public String ZipCode { get; set; }
        public String City { get; set; }
        public String State { get; set; }
    }
}
