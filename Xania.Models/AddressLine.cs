using System.ComponentModel.DataAnnotations.Schema;

namespace Xania.Models
{
    [ComplexType]
    public class AddressLine
    {
        public AddressType Type { get; set; }
        public string Value { get; set; }
    }
}