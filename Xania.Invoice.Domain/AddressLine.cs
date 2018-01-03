using System.ComponentModel.DataAnnotations.Schema;

namespace Xania.Invoice.Domain
{
    [ComplexType]
    public class AddressLine
    {
        public AddressType Type { get; set; }
        public string Value { get; set; }
    }
}