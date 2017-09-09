namespace Xania.Models
{
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public Address Address { get; set; } = new Address();
    }
}