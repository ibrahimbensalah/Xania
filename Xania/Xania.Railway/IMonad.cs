using System;

namespace Xania.Railway
{
    public interface IMonad<out T>
    {
        IMonad<U> Map<U>(Func<T, U> func);
        IMonad<U> Bind<U>(Func<T, IMonad<U>> func);
    }
}