namespace Xania.CosmosDb.AST
{
    public interface IStep
    {
        string ToGremlin();
        IStep Has(IStep step);
    }

    public interface IPipe: IStep
    {
        IStep Where(IStep predicate);
        IStep SelectMany(IStep step, IStep step1);
    }
}
