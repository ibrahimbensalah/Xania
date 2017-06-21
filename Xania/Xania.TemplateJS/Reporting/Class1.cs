using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Security.Cryptography;
using System.Text;

namespace Xania.TemplateJS.Reporting
{
    public static class GuidUtil
    {
        public static Guid ToGuid(this string src)
        {
            byte[] stringbytes = Encoding.UTF8.GetBytes(src);
            byte[] hashedBytes = SHA1.Create().ComputeHash(stringbytes);
            Array.Resize(ref hashedBytes, 16);
            return new Guid(hashedBytes);
        }
    }

    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public Address Address { get; set; } = new Address();
    }

    public class Address
    {
        public ICollection<AddressLine> Lines { get; set; } = new Collection<AddressLine>();
        public string Location { get; set; }
        public string FullName { get; set; }
    }

    public class AddressLine
    {
        public AddressType Type { get; set; }
        public string Value { get; set; }
    }

    public enum AddressType
    {
        Street,
        Location,
        Phone,
        Fax,
        ZipCode
    }

    public class Invoice
    {
        public Guid Id { get; set; }

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

    public class HourDeclaration
    {
        public string Description { get; set; }
        public decimal HourlyRate { get; set; }
        public float Hours { get; set; }
    }
}
