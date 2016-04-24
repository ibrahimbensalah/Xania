using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Microsoft.SqlServer.Server;

namespace Xania.Data
{
    public static class RepositoryExtensions
    {
        public static void Delete<TModel>(this IRepository<TModel> repository, TModel model) 
            where TModel : class
        {
            repository.Delete(m => m == model);
        }

        public static Page<TModel> Page<TModel>(this IRepository<TModel> repository, IPageRequest request)
        {
            return repository.ToPageResult(request);
        }

        public static Page<TModel> ToPageResult<TModel>(this IEnumerable<TModel> enumerable, IPageRequest request)
        {
            return enumerable.AsQueryable().ToPageResult(request);
        }

        public static Page<TModel> ToPageResult<TModel>(this IQueryable<TModel> queryable, IPageRequest request)
        {
            if (request != null)
            {
                var predicate = request.Predicate<TModel>();
                if (predicate != null)
                    queryable = queryable.Where(predicate);
            }

            var skip = request == null ? 0 : request.Skip;
            var take = request == null ? 0 : request.Take ?? 50;
            var sort = request == null ? null : request.Sort;

            return new Page<TModel>
            {
                Data = queryable.OrderBy(sort).Skip(skip).Take(take).ToList(),
                Total = queryable.Count()
            };
        }

        public static IQueryable<TModel> OrderBy<TModel>(this IQueryable<TModel> queryable, string propertyExpr)
        {
            var property = typeof(TModel).FindProperty(propertyExpr);
            if (property == null)
                return queryable;

            var type  = typeof (OrderByHandler<,>).MakeGenericType(typeof (TModel), property.PropertyType);
            var ctor = type.GetConstructors().Single();

            var handler = (IQueryHandler<TModel>) ctor.Invoke(new object[] {property});

            return handler.Execute(queryable);
        }

        private interface IQueryHandler<TModel>
        {
            IQueryable<TModel> Execute(IQueryable<TModel> queryable);
        }

        private class OrderByHandler<TModel, TKey> : IQueryHandler<TModel>
        {
            private readonly PropertyInfo _property;

            public OrderByHandler(PropertyInfo property)
            {
                _property = property;
            }

            public IQueryable<TModel> Execute(IQueryable<TModel> queryable)
            {
                var paramX = Expression.Parameter(typeof(TModel));
                var propertyX = Expression.Property(paramX, _property);
                var lambdaX = Expression.Lambda<Func<TModel, TKey>>(propertyX, paramX);

                return queryable.OrderBy(lambdaX);
            }
        }
        public static PropertyInfo FindProperty(this Type type, string propertyExpr)
        {
            if (propertyExpr == null)
                return null;

            propertyExpr = propertyExpr.Replace(" ", string.Empty);

            if (string.IsNullOrEmpty(propertyExpr))
                return null;

            var property = type.GetProperty(propertyExpr,
                BindingFlags.Instance | BindingFlags.IgnoreCase | BindingFlags.Public);
            if (property == null)
                throw new ArgumentOutOfRangeException("Property not found" + type.FullName, propertyExpr);
            return property;
        }

    }

    public interface IPageRequest
    {
        int Skip { get; set; }

        int? Take { get; set; }

        string Sort { get; set; }

        Expression<Func<TModel, bool>> Predicate<TModel>();
    }

    public interface IRequestFilter
    {
        Expression<Func<TModel, bool>> Predicate<TModel>();
    }

    public class DefaultRequestFilter : Dictionary<string, string>, IRequestFilter
    {
        public Expression<Func<TModel, bool>> Predicate<TModel>()
        {
            var paramX = Expression.Parameter(typeof(TModel));
            Expression expr = null;
            foreach (var kvp in this)
            {
                var modelProperty = typeof(TModel).FindProperty(kvp.Key);
                var propertyValue = GetValue(kvp.Value, modelProperty.PropertyType);

                if (propertyValue == null)
                    continue;

                var propertyX = Expression.Property(paramX, modelProperty.Name);
                Expression valueX = Expression.Constant(propertyValue);
                if (modelProperty.PropertyType != modelProperty.PropertyType)
                    valueX = Expression.Convert(valueX, modelProperty.PropertyType);

                var equalsX = Expression.Equal(propertyX, valueX);
                expr = expr == null ? equalsX : Expression.And(expr, equalsX);
            }

            if (expr == null)
                return null;
            else
                return Expression.Lambda<Func<TModel, bool>>(expr, paramX);
        }

        private object GetValue(string value, Type propertyType)
        {
            var converter = TypeDescriptor.GetConverter(propertyType);
            if (converter.CanConvertFrom(typeof (string)))
                return converter.ConvertFrom(value);
            return value;
        }
    }

    public class PageRequest<TFilter> : IPageRequest 
        where TFilter : IRequestFilter
    {
        public int Skip { get; set; }

        public int? Take { get; set; }

        public TFilter Filter { get; set; }

        public string Sort { get; set; }

        public Expression<Func<TModel, bool>> Predicate<TModel>()
        {
            return Filter == null ? null : Filter.Predicate<TModel>();
        }
    }

    public class Page<TModel>
    {
        public IEnumerable<TModel> Data { get; set; }
        public int Total { get; set; }
    }

}