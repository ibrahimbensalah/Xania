using System;
using System.IO;
using System.Linq;
using Xania.DataAccess;
using Xania.Ledger.Domain.Models;

namespace Xania.Ledger.Domain.Services
{
    public class JournalService
    {
        private readonly IObjectStore<JournalEntry> _journalRepository;
        private readonly IDocumentStore _documentStore;

        public JournalService(IObjectStore<JournalEntry> journalRepository, IDocumentStore documentStore)
        {
            _journalRepository = journalRepository;
            _documentStore = documentStore;
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
            throw new NotImplementedException();
        }
    }
}
