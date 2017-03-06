using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class UserController
    {
        [HttpPost]
        public User AddUser([FromBody]User user)
        {
            return user;
        }
    }
}
