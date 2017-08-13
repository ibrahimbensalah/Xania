using System;

namespace Xania.Railway
{
    public interface IFailure
    {
        string Message { get; }

        Exception Exception { get; }
    }
}