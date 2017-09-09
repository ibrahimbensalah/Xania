using System;

namespace Xania.Railway
{
    public static class MonadExtensions
    {
        public static IMonad<S> SelectMany<T, U, S>(this IMonad<T> monad, Func<T, IMonad<U>> monadSelector, Func<T, U, IMonad<S>> resultSelector)
        {
            return monad.Bind(r => monadSelector(r).Bind(u => resultSelector(r, u)));
        }

        public static IMonad<S> SelectMany<T, U, S>(this T source, Func<T, IMonad<U>> monadSelector, Func<T, U, IMonad<S>> resultSelector)
        {
            return monadSelector(source).Bind(u => resultSelector(source, u));
        }

        public static IMonad<U> Select<T, U>(this IMonad<T> monad, Func<T, U> selector)
        {
            return monad.Map(selector);
        }
    }
}