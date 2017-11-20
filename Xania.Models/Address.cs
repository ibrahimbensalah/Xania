using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace Xania.Models
{
    public class Address: MarshalByRefObject
    {
        public ICollection<AddressLine> Lines { get; set; } = new Collection<AddressLine>();
        public string Location { get; set; }
        public string FullName { get; set; }
    }
}
