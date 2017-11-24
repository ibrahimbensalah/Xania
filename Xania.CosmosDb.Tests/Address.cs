using System;

namespace Xania.CosmosDb.Tests
{
    public class Address: MarshalByRefObject
    {
        public string Location { get; set; }
        public string Id { get; set; }
    }
}