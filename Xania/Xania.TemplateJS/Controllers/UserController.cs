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
            await _users.SaveAsync(x => x.Id == user.Id, user);
            return null;
        }
    }
}
