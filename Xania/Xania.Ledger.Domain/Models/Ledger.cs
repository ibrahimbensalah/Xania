using System;

namespace Xania.Ledger.Domain.Models
{
    public class Ledger
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public Ledger ParentLedger { get; set; }
    }
}
