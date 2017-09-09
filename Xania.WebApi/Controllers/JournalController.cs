using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web.Http;
using Xania.DataAccess;
using Xania.Ledger.Domain.Models;

namespace Xania.WebApi.Controllers
{
    [RoutePrefix("ledger/journal")]
    public class JournalController : ApiController
    {
        private readonly IObjectStore<JournalEntry> _journalRepository;
        private readonly IObjectStore<Ledger.Domain.Models.Ledger> _ledgerRepository;

        public JournalController(
            IObjectStore<JournalEntry> journalRepository,
            IObjectStore<Ledger.Domain.Models.Ledger> ledgerRepository)
        {
            _journalRepository = journalRepository;
            _ledgerRepository = ledgerRepository;
        }

        [HttpGet]
        [Route("")]
        public IHttpActionResult GetAll()
        {
            var all = _journalRepository.AsQueryable().Select(ViewModelSelectExpr);
            return Ok(all);
        }

        [HttpGet]
        [Route("{id}")]
        public IHttpActionResult Get(Guid id)
        {
            var entry = _journalRepository.FirstOrDefault(e => e.Id == id);
            if (entry == null)
                return NotFound();

            return Ok(GetViewModel(entry));
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Create([FromBody] JournalViewModel model)
        {
            var entry = new JournalEntry
            {
                Id = Guid.NewGuid(),
                CreateDate = DateTime.UtcNow,
            };
            Map(model, entry);
            _journalRepository.Add(entry);

            return Created(Url.Content("~/ledger/journal/" + entry.Id), GetViewModel(entry));
        }

        [HttpPut]
        [Route("")]
        public IHttpActionResult Update([FromBody] JournalViewModel model)
        {
            var entry = _journalRepository.FirstOrDefault(e => e.Id == model.Id);
            if (entry == null)
                return NotFound();

            Map(model, entry);

            return Ok();
        }

        private void Map(JournalViewModel model, JournalEntry entry)
        {
            entry.Description = model.Description;
            entry.Mutations = model.Mutations
                .Select(m => new LedgerMutation
                {
                    Amount = m.Amount ?? 0,
                    Ledger = _ledgerRepository.Single(e => e.Id == m.LedgerId)
                }).ToList();
        }

        private static JournalViewModel GetViewModel(JournalEntry entry)
        {
            return ViewModelSelectExpr.Compile().Invoke(entry);
        }

        private static Expression<Func<JournalEntry, JournalViewModel>> ViewModelSelectExpr
        {
            get
            {
                return entry => new JournalViewModel
                {
                    Id = entry.Id,
                    Description = entry.Description,
                    Mutations = entry.Mutations.Select(m => new MutationViewModel
                    {
                        Amount = m.Amount,
                        LedgerId = m.Ledger != null ? (Guid?)m.Ledger.Id : null
                    })
                };
            }
        }
    }

    public class JournalViewModel
    {
        public JournalViewModel()
        {
            Mutations = new List<MutationViewModel>();
        }
        public string Description { get; set; }
        public IEnumerable<MutationViewModel> Mutations { get; set; }
        public Guid Id { get; set; }
    }

    public class MutationViewModel
    {
        public Guid? LedgerId { get; set; }
        public decimal? Amount { get; set; }
    }
}
