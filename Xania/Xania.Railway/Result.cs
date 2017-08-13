using System;

namespace Xania.Railway
{
    /// <summary>
    /// Result monad
    /// </summary>
    /// <typeparam name="TSuccess"></typeparam>
    public abstract class Result<TSuccess>: IMonad<TSuccess>
    {
        public class SuccessResult : Result<TSuccess>, ISuccessResult<TSuccess>
        {
            public TSuccess Value { get; }

            public SuccessResult(TSuccess value)
            {
                this.Value = value;
            }

            public override IMonad<U> Map<U>(Func<TSuccess, IMonad<U>> next)
            {
                try
                {
                    return next(Value);
                }
                catch (Exception ex)
                {
                    return new Result<U>.Failure(ex);
                }
            }

            public override IMonad<U> Map<U>(Func<TSuccess, U> next)
            {
                return Result.Success(next(Value));
            }
        }

        public class Failure : Result<TSuccess>, IFailure
        {
            public string Message { get; }

            public Exception Exception { get; }

            public Failure(string message)
            {
                Message = message;
            }

            public Failure(Exception exception)
                : this(exception.Message)
            {
                Exception = exception;
            }

            public override IMonad<U> Map<U>(Func<TSuccess, IMonad<U>> next)
            {
                return Result.Failure<U>(this.Message);
            }

            public override IMonad<U> Map<U>(Func<TSuccess, U> next)
            {
                return Result.Failure<U>(this.Message);
            }
        }

        public abstract IMonad<U> Map<U>(Func<TSuccess, IMonad<U>> next);

        public abstract IMonad<U> Map<U>(Func<TSuccess, U> next);
    }

    public static class Result
    {
        public static Result<T>.SuccessResult Success<T>(T value)
        {
            return new Result<T>.SuccessResult(value);
        }

        public static Result<T>.Failure Failure<T>(string message)
        {
            return new Result<T>.Failure(message);
        }
    }
}