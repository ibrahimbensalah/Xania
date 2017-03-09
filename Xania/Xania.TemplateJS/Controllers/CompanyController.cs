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

    public class Company
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
        public Address Address { get; set; } = new Address();
    }

    public class Address
    {
        public AddressLine[] Lines { get; set; }
        public string Location { get; set; }
        public string FullName { get; set; }
    }

    public class AddressLine
    {
        public AddressType Type { get; set; }
    }

    public enum AddressType
    {
        Street,
        Location,
        Phone,
        Fax
    }
}
