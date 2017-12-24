using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using NUnit.Framework;
using Xania.Reflection;

namespace Xania.CosmosDb.Tests
{
    public class HelperTests
    {
        [Test]
        public void JObjectToEnumerable()
        {
            var obj = JObject.FromObject(new
            {
                Id = 1,
                Friends = new Person { Id = 2 }
            });

            Console.WriteLine(obj);

            var person = obj.ToObject<Person>(new JsonSerializer
            {
                Converters = { new GraphConverter() }
            });
            person.Id.Should().Be(1);
            person.Friends.Should().ContainSingle().Which.Id.Should().Be(2);
        }
    }
}
