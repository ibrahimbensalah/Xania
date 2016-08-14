using System.IO;
using System.Text;
using FluentAssertions;
using NUnit.Framework;

namespace Xania.DataAccess.Tests
{
    public class PhysicalFileServiceTests
    {
        private DiskDocumentStore _repository;

        [SetUp]
        public void SetupService()
        {
            var dir = Path.Combine(Path.GetTempPath(), "file-resources-xn");
            Directory.CreateDirectory(dir);
            Directory.Delete(dir, true);

            _repository = new DiskDocumentStore(dir);
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
            var resourceId = _repository.Add("test", StringToStream(content));
            // act
            _repository.Read("test", resourceId, s =>
            {
                // assert
                var reader = new StreamReader(s);
                reader.ReadToEnd().Should().Be(content);
            });
        }

        [Test]
        public void WeShouldGetListOfAllAvailableFiles()
        {
            var res1 = _repository.Add("test", StringToStream("some content 1"));
            var res2 = _repository.Add("test", StringToStream("some content 2"));

            _repository.List("test").Should().BeEquivalentTo(res1, res2);
        }

        private Stream StringToStream(string someContent)
        {
            var bytes = Encoding.UTF8.GetBytes(someContent);
            return new MemoryStream(bytes);
        }
    }
}
