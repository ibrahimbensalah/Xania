//using System;
//using System.Collections.Generic;
//using System.Linq;

//namespace Xania.DataAccess
//{
//    internal static class ModelDescriptor
//    {
//        public static IEnumerable<PropertyDescriptor> KeyProperties(this Type modelType)
//        {
//            var allProperties = TypeDescriptor.GetProperties(modelType).OfType<PropertyDescriptor>().ToArray();
//            var keyProperties =
//                allProperties.Where(prop => prop.Attributes.OfType<KeyAttribute>().Any()).ToArray();

//            if (keyProperties.Any())
//                return keyProperties;

//            var idProperty = allProperties.FirstOrDefault(p => p.Name.Equals("Id", StringComparison.OrdinalIgnoreCase));

//            if (idProperty != null)
//                return new[] { idProperty };

//            var modelIdProperty = allProperties.FirstOrDefault(p => p.Name.Equals(modelType.Name + "Id", StringComparison.OrdinalIgnoreCase));

//            if (modelIdProperty != null)
//                return new[] { modelIdProperty };

//            return Enumerable.Empty<PropertyDescriptor>();
//        }

//        public static IEnumerable<object> Keys<TModel>(this TModel model)
//        {
//            var keyProperties = typeof(TModel).KeyProperties().ToArray();

//            if (!keyProperties.Any())
//                throw new InvalidOperationException("Model has no key properties");

//            var keys = keyProperties.OrderBy(x => x.Name).Select(p => new
//            {
//                p.Name,
//                Value = p.GetValue(model)
//            }).ToArray();

//            var nullKeys = keys.Where(k => k.Value == null);
//            if (nullKeys.Any())
//                throw new InvalidOperationException(string.Format("Key properties with null values: {0}", keys.Select(k=>k.Name)));

//            return keys.Select(k => k.Value).ToArray();
//        }
//    }
//}
