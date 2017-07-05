using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class UserController
    {
        private readonly IObjectStore<User> _users;

        public UserController(IObjectStore<User> users)
        {
            _users = users;
        }

        [HttpPost]
        public async Task<User> AddUser([FromBody]User user)
        {
            await _users.AddAsync(user);
            return null;
        }

        [HttpPost]
        [Route("query")]
        public object Query([FromBody]dynamic ast)
        {
            return QueryHelper.accept(ast, new Dictionary<string, object>
            {
                { "users", _users }
            });
        }
    }

    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; }
        public string Email { get; set; }
        public string[] Roles { get; set; }
        public bool EmailConfirmed { get; set; }
    }

}
