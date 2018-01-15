using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Xania.Graphs.Linq
{
    public static class QueryableHelper
    {
        private static MethodInfo s_Select_TSource_2;
        public static MethodInfo 
            Select_TSource_2<TSource, TResult>() => Select_TSource_2(typeof(TSource), typeof(TResult));
        public static MethodInfo Select_TSource_2(Type sourceType, Type resultType) =>
            (s_Select_TSource_2 ??
             (s_Select_TSource_2 = new Func<IQueryable<int>, Expression<Func<int, double>>, IQueryable<double>>(Queryable.Select).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType, resultType);

        private static MethodInfo s_SelectMany_TSource_2;
        public static MethodInfo SelectMany_TSource_2<TSource, TResult>() =>
            (s_SelectMany_TSource_2 ??
             (s_SelectMany_TSource_2 = new Func<IQueryable<TSource>, Expression<Func<TSource, IEnumerable<TResult>>>, IQueryable<TResult>>(Queryable.SelectMany).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(typeof(TSource), typeof(TResult));

        private static MethodInfo s_Where_TSource_1;
        public static MethodInfo Where_TSource_1<TSource>() =>
            (s_Where_TSource_1 ?? (s_Where_TSource_1 =
                 new Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, IQueryable<TSource>>(Queryable.Where)
                     .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(typeof(TSource));

        private static MethodInfo s_Any_TSource_1;
        public static MethodInfo Any_TSource_1<TSource>() => Any_TSource_1(typeof(TSource));
        public static MethodInfo Any_TSource_1(Type sourceType) =>
            (s_Any_TSource_1 ?? (s_Any_TSource_1 =
                 new Func<IQueryable<int>, bool>(Queryable.Any)
                     .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType);
    }

    public static class CollectionHelper
    {
        private static MethodInfo s_CollectionAdd_1;
        public static MethodInfo CollectionAdd_1<TModel>() => CollectionAdd_1(typeof(TModel));
        public static MethodInfo CollectionAdd_1(Type modelType) =>
            (s_CollectionAdd_1 ?? (s_CollectionAdd_1 =
                 new Action<Collection<int>, int>(Add)
                     .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(modelType);

        public static void Add<T>(this Collection<T> collection, T item)
        {
            collection.Add(item);
        }
    }
}
