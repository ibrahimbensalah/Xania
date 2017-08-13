using System;

namespace Xania.Railway
{
    public static class MonadExtensions
    {
        public static Func<T, IMonad<V>> Bind<T, R, V>(this Func<T, IMonad<R>> operation, Func<R, IMonad<V>> nextResult)
        {
            return t => operation(t).Map(nextResult);
        }

        public static Func<T, IMonad<S>> SelectMany<T, R, U, S>(this Func<T, IMonad<R>> operation, Func<R, IMonad<U>> monadSelector, Func<R, U, S> resultSelector)
        {
            return t => operation(t).Map(r => monadSelector(r).Map(u => Result.Success(resultSelector(r, u))));
        }

        public static Func<T, IMonad<S>> SelectMany<T, R, U, S>(this Func<T, IMonad<R>> operation, Func<R, U> nextSelector, Func<R, U, S> resultSelector)
        {
            return t => operation(t).Map(r => Result.Success(resultSelector(r, nextSelector(r))));
        }

        public static Func<T, IMonad<S>> SelectMany<T, R, U, S>(this Func<T, IMonad<R>> operation, Func<R, IMonad<U>> monadSelector, Func<R, U, IMonad<S>> resultSelector)
        {
            return t => operation(t).Map(r => monadSelector(r).Map(u => resultSelector(r, u)));
        }

        public static Func<T, IMonad<S>> SelectMany<T, R, U, S>(this Func<T, R> operation, Func<R, IMonad<U>> monadSelector, Func<R, U, S> resultSelector)
        {
            return SelectMany<T, R, U, S>(t => Result.Success(operation(t)), monadSelector, resultSelector);
        }

        public static Func<T, IMonad<S>> SelectMany<T, R, U, S>(this Func<T, R> operation, Func<R, U> nextSelector, Func<R, U, S> resultSelector)
        {
            return SelectMany<T, R, U, S>(t => Result.Success(operation(t)), nextSelector, resultSelector);
        }

        public static Func<T, IMonad<S>> SelectMany<T, R, U, S>(this Func<T, R> operation, Func<R, IMonad<U>> monadSelector, Func<R, U, IMonad<S>> resultSelector)
        {
            return SelectMany<T, R, U, S>(t => Result.Success(operation(t)), monadSelector, resultSelector);
        }

        public static Func<T, IMonad<U>> Select<T, R, U>(this Func<T, IMonad<R>> operation, Func<R, IMonad<U>> selector)
        {
            return operation.Bind(selector);
        }

        //public static Operation<T, U> Select<T, R, U>(this Operation<T, R> operation, Func<R, U> selector)
        //{
        //    return operation.Bind(t => Result.Success(selector(t)));
        //}
    }

    public interface IMonad<T>
    {
        // IMonad<U> Map<U>(Func<T, U> func);
        IMonad<U> Map<U>(Func<T, IMonad<U>> func);
    }
}