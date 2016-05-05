using System;
using System.Collections.Generic;

namespace Xania.Ledger.Domain.Models
{
    public class JournalEntry
    {
        public Guid Id { get; set; }

        public DateTime CreateDate { get; set; }

        public string Description { get; set; }

        public virtual ICollection<LedgerMutation> Mutations { get; set; }

        public virtual ICollection<Guid> Attachments { get; set; }
    }
}