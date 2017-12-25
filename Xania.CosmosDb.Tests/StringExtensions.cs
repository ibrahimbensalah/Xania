using System.Security;

namespace Xania.CosmosDb.Tests
{
    public static class StringExtensions
    {
        public static string ToCamelCase(this string str)
        {
            if (string.IsNullOrEmpty(str) || str.Length == 0)
                return str;
            return char.ToLowerInvariant(str[0]) + str.Substring(1);
        }

        public static SecureString Secure(this string str)
        {
            var secure = new SecureString();
            foreach (char c in str)
                secure.AppendChar(c);
            
            return secure;
        }
    }
}