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
        public static MethodInfo SelectMany_TSource_2<TSource, TResult>() => SelectMany_TSource_2(typeof(TSource), typeof(TResult));
        public static MethodInfo SelectMany_TSource_2(Type sourceType, Type resultType) =>
            (s_SelectMany_TSource_2 ??
             (s_SelectMany_TSource_2 = new Func<IQueryable<int>, Expression<Func<int, IEnumerable<int>>>, IQueryable<int>>(Queryable.SelectMany).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType, resultType);

        private static MethodInfo s_Where_TSource_1;
        public static MethodInfo Where_TSource_1<TSource>() => Where_TSource_1(typeof(TSource));
        public static MethodInfo Where_TSource_1(Type sourceType) =>
            (s_Where_TSource_1 ?? (s_Where_TSource_1 =
                 new Func<IQueryable<int>, Expression<Func<int, bool>>, IQueryable<int>>(Queryable.Where)
                     .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType);

        private static MethodInfo s_Any_TSource_1;
        public static MethodInfo Any_TSource_1<TSource>() => Any_TSource_1(typeof(TSource));
        public static MethodInfo Any_TSource_1(Type sourceType) =>
            (s_Any_TSource_1 ?? (s_Any_TSource_1 =
                 new Func<IQueryable<int>, bool>(Queryable.Any)
                     .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType);

        //private static MethodInfo s_SingleOrDefault_TSource_1;
        //public static MethodInfo SingleOrDefault_TSource_1<TSource>() => SingleOrDefault_TSource_1(typeof(TSource));
        //public static MethodInfo SingleOrDefault_TSource_1(Type sourceType) =>
        //    (s_SingleOrDefault_TSource_1 ?? (s_SingleOrDefault_TSource_1 = new Func<>(Queryable.SingleOrDefault)))

        private static MethodInfo s_OfType_TSource_1;
        public static MethodInfo
            OfType_TSource_1<TResult>() => OfType_TSource_1(typeof(TResult));
        public static MethodInfo OfType_TSource_1(Type resultType) =>
            (s_OfType_TSource_1 ??
             (s_OfType_TSource_1 = new Func<IQueryable, IQueryable<int>>(Queryable.OfType<int>).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(resultType);
    }

    public static class GraphExpressions
    {
        public static Expression GetVertexExpression(Expression source)
        {
            return null;
        }
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

    public static class EnumerableHelper
    {
        private static MethodInfo s_Select_TSource_2;
        public static MethodInfo
            Select_TSource_2<TSource, TResult>() => Select_TSource_2(typeof(TSource), typeof(TResult));
        public static MethodInfo Select_TSource_2(Type sourceType, Type resultType) =>
            (s_Select_TSource_2 ??
             (s_Select_TSource_2 = new Func<IEnumerable<int>, Func<int, double>, IEnumerable<double>>(Enumerable.Select).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType, resultType);

        private static MethodInfo s_FirstOrDefault;
        public static MethodInfo FirstOrDefault<TSource>() => FirstOrDefault(typeof(TSource));
        public static MethodInfo FirstOrDefault(Type sourceType) =>
            (s_FirstOrDefault ??
             (s_FirstOrDefault = new Func<IEnumerable<int>, int>(Enumerable.FirstOrDefault).GetMethodInfo()
                 .GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType);


        private static MethodInfo s_SelectMany_TSource_2;
        public static MethodInfo SelectMany_TSource_2<TSource, TResult>() =>
            (s_SelectMany_TSource_2 ??
             (s_SelectMany_TSource_2 = new Func<IEnumerable<TSource>, Func<TSource, IEnumerable<TResult>>, IEnumerable<TResult>>(Enumerable.SelectMany).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(typeof(TSource), typeof(TResult));

        private static MethodInfo s_Any_TSource_1;
        public static MethodInfo Any_TSource_1<TSource>() =>
            (s_Any_TSource_1 ??
             (s_Any_TSource_1 = new Func<IEnumerable<TSource>, Func<TSource, bool>, bool>(Enumerable.Any)
                 .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(typeof(TSource));

        private static MethodInfo s_OfType_TSource_1;
        public static MethodInfo
            OfType_TSource_1<TResult>() => OfType_TSource_1(typeof(TResult));
        public static MethodInfo OfType_TSource_1(Type resultType) =>
            (s_OfType_TSource_1 ??
             (s_OfType_TSource_1 = new Func<IEnumerable, IEnumerable<int>>(Enumerable.OfType<int>).GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(resultType);

        private static MethodInfo s_Where_TSource_1;
        public static MethodInfo Where_TSource_1<TSource>() => Where_TSource_1(typeof(TSource));
        public static MethodInfo Where_TSource_1(Type sourceType) =>
            (s_Where_TSource_1 ?? (s_Where_TSource_1 =
                 new Func<IEnumerable<int>, Func<int, bool>, IEnumerable<int>>(Enumerable.Where)
                     .GetMethodInfo().GetGenericMethodDefinition()))
            .MakeGenericMethod(sourceType);
    }

    public static class DictionaryHelper
    {
        private static readonly Type Instance = typeof(Dictionary<,>);

        public static MethodInfo Add<TKey, TValue>() => Add(typeof(TKey), typeof(TValue));
        public static MethodInfo Add(Type keyType, Type valueType)
        {
            return Instance.MakeGenericType(keyType, valueType).GetMethod("Add");
        }

        //(s_Add ??
            // (s_Add = new Action<int, int>(_instance.Add).GetMethodInfo()
            //     .GetGenericMethodDefinition()))
            //.MakeGenericMethod(keyType, valueType);


    }
}
