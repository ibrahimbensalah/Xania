using System.IO;

namespace Xania.Ledger.Domain.Models
{
    public class PhysicalFile : IAttachment
    {
        public string Name { get; set; }
        public string Path { get; set; }
        public Stream Open()
        {
            return File.OpenRead(Path);
        }
    }
}