using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations.Schema;

namespace Xania.Invoice.Domain
{
    [ComplexType]
    public class Address: MarshalByRefObject
    {
        public ICollection<AddressLine> Lines { get; set; } = new Collection<AddressLine>();
        public string Location { get; set; }
        public string FullName { get; set; }
    }
}
