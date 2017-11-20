namespace Xania.CosmosDb
{
    internal static class StringExtensions
    {
        public static string ToCamelCase(this string str)
        {
            if (string.IsNullOrEmpty(str) || str.Length == 0)
                return str;
            return char.ToLowerInvariant(str[0]) + str.Substring(1);
        }
    }
}