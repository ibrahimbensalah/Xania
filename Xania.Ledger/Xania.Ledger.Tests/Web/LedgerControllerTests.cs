using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Xania.AspNet.Simulator;
using Xania.DataAccess;
using Xania.Ledger.Domain.Models;
using Xania.Ledger.Web;

namespace Xania.Ledger.Domain.Tests.Web
{
    public class LedgerControllerTests
    {
        [Test]
        public void AddLedgerTest()
        {
            // arrange
            //var repository = new TransientRepository<JournalEntry>(() => new JournalEntry());
            //var viewModel = new JournalViewModel
            //{
            //    Mutations = new List<LedgerMutation> { new LedgerMutation() },
            //    Description = "",
            //    Attachements = new List<Attachment> { new Attachment() }
            //};
            //var action = new LedgerController(repository)
            //    .Action(c => c.Add(viewModel))
            //    .RequestData(new object
            //    {
                    
            //    });

            //// act
            //var actionResult = action.GetActionResult();

            // assert
        }
    }
}
