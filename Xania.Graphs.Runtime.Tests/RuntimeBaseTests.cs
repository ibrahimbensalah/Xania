﻿using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using Xania.Graphs.Linq;
using Xania.Invoice.Domain;

namespace Xania.Graphs.Runtime.Tests
{
    public abstract class RuntimeBaseTests
    {
        protected abstract IQueryable<TModel> Set<TModel>(params object[] models);

        protected static readonly Company xania = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Xania Software",
            Address = new Address
            {
                FullName = "Ibrahim ben Salah",
                Location = "Amstelveen",
                Lines =
                {
                    new AddressLine { Type = AddressType.Street, Value = "Punter 315" }
                }
            }
        };
        protected static readonly Company rider = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Rider International",
            Address = new Address
            {
                FullName = "Edi Grittenberg",
                Location = "Leiden",
                Lines =
                {
                    new AddressLine { Type = AddressType.Street, Value = "Leiden centrum 1" }
                }
            }
        };

        [Test]
        public void QueryBasicTest()
        {
            // arrange
            var companies = Set<Company>(xania);

            // act
            var company = companies.Should().ContainSingle().Subject;

            // assert
            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }

        [Test]
        public void QueryMemberTest()
        {
            // arrange
            var contract = new Contract(xania, rider);
            var contracts = Set<Contract>(contract);

            // act
            var suppliers = contracts.Select(e => e.Supplier);
            var company = suppliers.Should().ContainSingle().Subject;

            // assert
            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }

        [Test]
        public void QueryFilterTest()
        {
            // arrange
            var companies = Set<Company>(xania, rider);

            // act
            var company = companies.Where(e => e.Name == "Xania Software").Should().ContainSingle().Subject;

            // assert
            company.Id.Should().Be(xania.Id);
            company.Name.Should().Be(xania.Name);
            company.Address.Should().NotBeNull();
            company.Address.FullName.Should().Be(xania.Address.FullName);
        }
    }

    public class TestData
    {
        public static Graph GetPeople()
        {
            var friend = new Person { Id = 2, FirstName = "Mr Robot"};
            var ibrahim = new Person
            {
                Id = 1,
                FirstName = "Ibrahim",
                Friend = friend,
                Enemy = new Person { Id = 3, Friends = { friend } },
                HQ = new Address
                {
                    FullName = "Freddy Corleone",
                    Location = "Amstelveen",
                    Lines = { new AddressLine { Type = AddressType.Street, Value = "Punter 315" } }
                },
                Tags = new[] { "Programmer", "Entrepeneur" },
                Friends = { friend }
            };
            friend.Friends.Add(new Person { Id = 4, FirstName = "test", Friend = new Person { Id = 5 } });

            return Graph.FromObject(friend, ibrahim);
        }
    }

    public class Person : MarshalByRefObject
    {
        public int Id { get; set; }
        public Person Friend { get; set; }
        public string FirstName { get; set; }
        public Person Enemy { get; set; }
        public Address HQ { get; set; }
        public string[] Tags { get; set; }
        public ICollection<Person> Friends { get; } = new List<Person>();
   }

    public class Contract
    {
        public DateTimeOffset StartDate { get; }
        public Company Supplier { get; }
        public Company Client { get; }

        public Contract()
        {
            StartDate = DateTimeOffset.Now;
        }

        public Contract(Company supplier, Company client)
            : this()
        {
            Supplier = supplier;
            Client = client;
        }
    }


}
