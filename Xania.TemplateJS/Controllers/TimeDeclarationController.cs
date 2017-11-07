using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class TimeDeclarationController
    {
        private readonly IObjectStore<TimeDeclaration> _declarationStore;

        public TimeDeclarationController(IObjectStore<TimeDeclaration> declarationStore)
        {
            _declarationStore = declarationStore;
        }

        [HttpPost]
        public async Task<TimeDeclaration> Add([FromBody]TimeDeclaration declaration)
        {
            if (declaration == null)
                throw new NullReferenceException();

            await _declarationStore.AddAsync(declaration);
            return null;
        }

        [HttpPut]
        public async Task<TimeDeclaration> Update([FromBody]TimeDeclaration declaration)
        {
            if (declaration == null)
                throw new NullReferenceException();

            await _declarationStore.UpdateAsync(declaration);
            return declaration;
        }

        [HttpGet]
        [Route("{id:guid}")]
        public Task<TimeDeclaration> Get(Guid id)
        {
            return Task.FromResult(_declarationStore.SingleOrDefault(e => e.Id == id));
        }

        [HttpDelete]
        [Route("{id}")]
        public Task Delete(Guid id)
        {
            return _declarationStore.DeleteAsync(e => e.Id == id);
        }
    }
}
