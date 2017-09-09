using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;
using Xania.Models;
using Xania.QL;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class CompanyController
    {
        private readonly IObjectStore<Company> _companies;

        public CompanyController(IObjectStore<Company> companies)
        {
            _companies = companies;
        }

        [HttpPost]
        public async Task<User> AddCompany([FromBody]Company company)
        {
            await _companies.UpdateAsync(x => x.Id == company.Id, company);
            return null;
        }

        [HttpPost]
        [Route("query")]
        public object Query([FromBody]dynamic ast)
        {
            return QueryHelper.accept(ast, new Dictionary<string, object>
            {
                { "companies", _companies }
            });
        }
    }
}
