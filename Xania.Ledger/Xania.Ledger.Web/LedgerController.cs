using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Xania.DataAccess;
using Xania.Ledger.Domain.Models;

namespace Xania.Ledger.Web
{
    public class LedgerController : Controller
    {
        private readonly IRepository<JournalEntry> _journalRepository;
        private readonly IRepository<Domain.Models.Ledger> _ledgerRepository;

        public LedgerController(IRepository<JournalEntry> journalRepository, IRepository<Domain.Models.Ledger> ledgerRepository)
        {
            _journalRepository = journalRepository;
            _ledgerRepository = ledgerRepository;
        }

        [HttpPost]
        public JournalEntry Create()
        {
            return new JournalEntry
            {
                Id = Guid.NewGuid(),
                CreateDate = DateTime.UtcNow
            };
        }

        [HttpPost]
        public void Update(JournalViewModel model)
        {
            _journalRepository.Add(new JournalEntry
            {
                Id = Guid.NewGuid(),
                CreateDate = DateTime.UtcNow,
                Description = model.Description,
                Mutations = model
                    .Mutations
                    .Select(m => new LedgerMutation
                    {
                        Amount = m.Amount,
                        Ledger = _ledgerRepository.Single(e => e.Id == m.LedgerId)
                    }).ToList(),
                Attachments = model.Attachements.ToList()
            });
        }
    }

    public class JournalViewModel
    {
        public IEnumerable<Guid> Attachements { get; set; }
        public string Description { get; set; }
        public IEnumerable<MutationViewModel> Mutations { get; set; }
    }

    public class MutationViewModel
    {
        public Guid LedgerId { get; set; }
        public decimal Amount { get; set; }
    }
}
