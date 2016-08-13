namespace Xania.Ledger.Domain.Models
{
    public class LedgerMutation
    {
        public decimal Amount { get; set; }

        public virtual Ledger Ledger { get; set; }
    }
}
