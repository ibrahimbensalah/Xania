namespace Xania.Railway
{
    public interface ISuccessResult<out T>
    {
        T Value { get; }
    }
}
