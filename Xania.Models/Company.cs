using System;
using System.ComponentModel.DataAnnotations;

namespace Xania.Models
{
    public class Company
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public Address Address { get; set; } = new Address();
    }
}
