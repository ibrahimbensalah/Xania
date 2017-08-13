using System;

namespace Xania.Railway
{
    public class Operation<T, R>
    {
        private readonly Func<T, IMonad<R>> _func;

        public Operation(Func<T, IMonad<R>> func)
        {
            _func = func;
        }

        public Operation<T, V> Bind<V>(Operation<R, V> nextResult)
        {
            return Operation<T, V>.Init(t => _func(t).Map(nextResult.Call));
        }

        public Operation<T, V> Bind<V>(Func<R, IMonad<V>> nextResult)
        {
            return Operation<T, V>.Init(t => _func(t).Map(nextResult));
        }

        public IMonad<R> Call(T value)
        {
            return _func(value);
        }

        public static Operation<T, R> Init(Func<T, IMonad<R>> func)
        {
            return new Operation<T, R>(func);
        }

        public static Operation<T, R> operator &(Operation<T, R> f, Operation<R, R> g)
        {
            return f.Bind(g);
        }

        public static IMonad<R> operator |(T input, Operation<T, R> f)
        {
            return f.Call(input);
        }
    }

    public static class MonadExtensions
    {
        public static Operation<T, S> SelectMany<T, R, U, S>(this Operation<T, R> operation, Func<R, IMonad<U>> monadSelector, Func<R, U, S> resultSelector)
        {
            return Operation<T, S>.Init(
                t => operation.Call(t).Map(r => monadSelector(r).Map(u => Result.Success(resultSelector(r, u)))));
        }

        public static Operation<T, S> SelectMany<T, R, U, S>(this Operation<T, R> operation, Func<R, U> nextSelector, Func<R, U, S> resultSelector)
        {
            return Operation<T, S>.Init(t => operation.Call(t).Map(r => Result.Success(resultSelector(r, nextSelector(r)))));
        }

        public static Operation<T, S> SelectMany<T, R, U, S>(this Operation<T, R> operation, Func<R, IMonad<U>> monadSelector, Func<R, U, IMonad<S>> resultSelector)
        {
            return Operation<T, S>.Init(
                t => operation.Call(t).Map(r => monadSelector(r).Map(u => resultSelector(r, u))));
        }

        public static Operation<T, S> SelectMany<T, R, U, S>(this Operation<T, R> operation, Func<R, U> nextSelector, Func<R, U, IMonad<S>> resultSelector)
        {
            return Operation<T, S>.Init(t => operation.Call(t).Map(r => resultSelector(r, nextSelector(r))));
        }

        public static Operation<T, U> Select<T, R, U>(this Operation<T, R> operation, Func<R, IMonad<U>> selector)
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