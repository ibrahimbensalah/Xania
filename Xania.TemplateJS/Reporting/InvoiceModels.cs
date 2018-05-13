using System;
using System.Security.Cryptography;
using System.Text;

namespace Xania.TemplateJS.Reporting
{
    public static class GuidUtil
    {
        public static Guid ToGuid(this object src)
        {
            return ToGuid(src.ToString());
        }

        public static Guid ToGuid(this string src)
        {
            byte[] stringbytes = Encoding.UTF8.GetBytes(src);
            byte[] hashedBytes = SHA1.Create().ComputeHash(stringbytes);
            Array.Resize(ref hashedBytes, 16);
            return new Guid(hashedBytes);
        }
    }


}
