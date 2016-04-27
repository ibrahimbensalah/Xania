using System;
using System.IO;
using System.Linq;
using Xania.DataAccess;
using Xania.Ledger.Domain.Models;

namespace Xania.Ledger.Domain.Services
{
    public class JournalService
    {
        private readonly IRepository<JournalEntry> _journalRepository;
        private readonly IStreamRepository _streamRepository;

        public JournalService(IRepository<JournalEntry> journalRepository, IStreamRepository streamRepository )
        {
            _journalRepository = journalRepository;
            _streamRepository = streamRepository;
        }

        public void AddJournal(JournalEntry entry)
        {
            var sum = entry.Mutations.Sum(m => m.Amount);
            if (sum != 0m)
            {
                throw new InvalidDataException("Journal is not balanced");
            }
            _journalRepository.Add(entry);
        }

        public Attachment CreateAttachment(string name, Stream contentStream)
        {
            Guid resourceId = Guid.NewGuid();
            _streamRepository.Add(resourceId, contentStream);
            return new Attachment
            {
                ResourceId = resourceId,
                Name = name,
            };
        }
    }
}
