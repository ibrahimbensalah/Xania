using System;
using System.IO;
using System.Linq;
using Xania.Ledger.Domain.Models;
using Xania.Ledger.Domain.Repositories;

namespace Xania.Ledger.Domain.Services
{
    public class JournalService
    {
        private readonly IRepository<JournalEntry> _repository;

        public JournalService(IRepository<JournalEntry> repository)
        {
            _repository = repository;
        }

        public void AddJournal(JournalEntry entry)
        {
            var sum = entry.Mutations.Sum(m => m.Amount);
            if (sum != 0m)
            {
                throw new InvalidDataException("Journal is not balanced");
            }
            _repository.Add(entry);
        }
    }
}
