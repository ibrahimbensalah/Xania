using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;

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
            await _companies.SaveAsync(x => x.Id == company.Id, company);
            return null;
        }
    }

    public class Company
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
    }
}
