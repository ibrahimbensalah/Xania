using System;
using System.IO;
using System.Text;
using FluentAssertions;
using NUnit.Framework;
using Xania.Ledger.Domain.Services;

namespace Xania.Ledger.Domain.Tests.Services
{
    public class PhysicalFileServiceTests
    {
        private PhysicalFileRepository _repository;

        [SetUp]
        public void SetupService()
        {
            var dir = Path.Combine(Path.GetTempPath(), "file-resources-xn");
            Directory.Delete(dir, true);

            _repository = new PhysicalFileRepository(dir);
        }

        [TestCase("some content 1")]
        [TestCase("some content 2")]
        [TestCase("some content 3")]
        [TestCase("some content 4")]
        [TestCase("some content 56")]
        [TestCase("some conten 7t")]
        public void WeShouldBeAbleToFindFileWhenAdded(string content)
        {
            // arrange
            // act
            var resourceId = _repository.Add(StringToStream(content));
            // assert
            using (var stream = _repository.Get(resourceId))
            {
                var reader = new StreamReader(stream);
                reader.ReadToEnd().Should().Be(content);
            }
        }

        [Test]
        public void WeShouldGetListOfAllAvailableFiles()
        {
            var res1 = _repository.Add(StringToStream("some content 1"));
            var res2 = _repository.Add(StringToStream("some content 2"));

            _repository.List().Should().BeEquivalentTo(res1, res2);
        }

        private Stream StringToStream(string someContent)
        {
            var bytes = Encoding.UTF8.GetBytes(someContent);
            return new MemoryStream(bytes);
        }
    }
}
