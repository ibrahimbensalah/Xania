namespace Xania.Graphs
{
    public class Values : IStep
    {
        public string Name { get; }

        public Values(string name)
        {
            Name = name;
        }

        public override string ToString()
        {
            if (Name.Equals("id"))
                return "id()";
            return $"values('{Name}')";
        }
    }

    public static class StringExtensions
    {
        public static string ToCamelCase(this string str)
        {
            if (string.IsNullOrEmpty(str) || str.Length == 0)
                return str;
            return char.ToLowerInvariant(str[0]) + str.Substring(1);
        }
    }

}
