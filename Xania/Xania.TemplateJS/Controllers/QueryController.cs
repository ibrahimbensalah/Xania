using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xania.DataAccess;

namespace Xania.TemplateJS.Controllers
{
    [Route("api/[controller]")]
    public class QueryController: Controller
    {
        private IObjectStore<User> _users;

        public QueryController(IObjectStore<User> users)
        {
            _users = users;
        }

        [HttpPost]
        public object Execute([FromBody]dynamic ast)
        {
            return GetUsers();
            //return accept(ast, new Store(new Dictionary<string, object>
            //{
            //    { "users", GetUsers() }
            //}));
        }

        public IEnumerable<User> GetUsers()
        {
            using (var enumerator = _users.GetEnumerator())
            {
                while (enumerator.MoveNext())
                    yield return enumerator.Current;
            }

            for (var i = 0; i < 10; i++)
            {
                yield return new User
                {
                    Name = "User " + DateTime.Now,
                    Email = "user" + i + "@xania.nl",
                    Roles = new[] {"Customer " + i, "Admin " + i},
                    EmailConfirmed = i % 2 == 0
                };
            }
        }

        private object accept(dynamic ast, Store store)
        {
            var type = (ExpressionType)ast.type;
            switch (type)
            {
                case ExpressionType.IDENT:
                    var name = (string) ast.name;
                    return store.Get(name);
                default:
                    throw new InvalidOperationException("unsupported type: " + type);
            }
        }
    }

    public class User
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string[] Roles { get; set; }
        public bool EmailConfirmed { get; set; }
    }

    public class Store
    {
        private readonly IDictionary<string, object> _values;

        public Store(IDictionary<string, object> values)
        {
            _values = values;
        }
        public object Get(string name)
        {
            object value;
            return _values.TryGetValue(name, out value) ? value : null;
        }
    }

    public enum ExpressionType
    {
        WHERE = 1,
        QUERY = 2,
        IDENT = 3,
        MEMBER = 4,
        APP = 5,
        SELECT = 6,
        CONST = 7,
        RANGE = 8,
        BINARY = 9,
        AWAIT = 10,
        PIPE = 11,
        COMPOSE = 12,
        LAMBDA = 13
    }
}

