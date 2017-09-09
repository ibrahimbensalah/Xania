using System;

namespace Xania.Railway
{
    public class SuccessResult<TSuccess> : IMonad<TSuccess>, ISuccessResult<TSuccess>
    {
        public TSuccess Value { get; }

        public SuccessResult(TSuccess value)
        {
            Value = value;
        }

        public IMonad<U> Bind<U>(Func<TSuccess, IMonad<U>> next)
        {
            try
            {
                return next(Value);
            }
            catch (Exception ex)
            {
                return new Failure<U>(ex);
            }
        }

        public IMonad<U> Map<U>(Func<TSuccess, U> next)
        {
            return Result.Success(next(Value));
        }
    }

    public class Failure<TSuccess> : IMonad<TSuccess>, IFailure
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

        public IMonad<U> Bind<U>(Func<TSuccess, IMonad<U>> next)
        {
            return Result.Failure<U>(this.Message);
        }

        public IMonad<U> Map<U>(Func<TSuccess, U> next)
        {
            return Result.Failure<U>(this.Message);
        }
    }


    public static class Result
    {
        public static SuccessResult<T> Success<T>(T value)
        {
            return new SuccessResult<T>(value);
        }

        public static Failure<T> Failure<T>(string message)
        {
            return new Failure<T>(message);
        }
    }
}