using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Xania.Graphs.Linq;

namespace Xania.Graphs.Structure
{
    public class Property
    {
        public string Name { get; }
        public PropertyValue Value { get; }

        public Property(string name, GraphValue value)
        {
            Value = new PropertyValue {Value = value, Id = GenerateHash(value)};
            Name = name.ToCamelCase();
        }

        public override int GetHashCode()
        {
            return Name.GetHashCode();
        }

        public override bool Equals(object obj)
        {
            if (obj is Property property)
                return property.Name.Equals(Name, StringComparison.InvariantCultureIgnoreCase);
            return false;
        }

        public static string GenerateHash(object value)
        {
            if (value is GraphValue gv)
                return ComputeHash(GetBytes(gv));

            if (value is string str)
                return GenerateHash(new GraphPrimitive(typeof(string), str));

            throw new NotImplementedException("GenerateHash: " + value.GetType());
        }

        public static IEnumerable<byte> GetBytes(GraphValue value)
        {
            if (value is GraphPrimitive prim)
                return Encoding.UTF8.GetBytes(prim.Value.ToString());
            if (value is GraphObject obj)
                return obj.Properties.SelectMany(p => GetBytes(p.Value.Value));
            if (value is GraphList list)
                return list.Items.SelectMany(GetBytes);

            throw new NotImplementedException("GetBytes: " + value.GetType());
        }

        public static string ComputeHash(IEnumerable<byte> bytes)
        {
            using (var sha = SHA256.Create())
            {
                // Convert the input string to a byte array and compute the hash.
                byte[] data = sha.ComputeHash(bytes.ToArray());

                // Create a new Stringbuilder to collect the bytes
                // and create a string.
                StringBuilder sBuilder = new StringBuilder();

                // Loop through each byte of the hashed data 
                // and format each one as a hexadecimal string.
                for (int i = 0; i < data.Length; i++)
                {
                    sBuilder.Append(data[i].ToString("x2"));
                }

                // Return the hexadecimal string.
                return sBuilder.ToString();
            }
        }
    }

    public class PropertyValue
    {
        public GraphValue Value { get; set; }
        public string Id { get; set; }
    }
}