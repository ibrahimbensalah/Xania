namespace Xania.CosmosDb.AST
{
    public interface IStep
    {
        string ToGremlin();
        IStep Has(IStep step);
    }

    public interface IPipe: IStep
    {
        IStep Where(Lambda predicate);
        IStep SelectMany(IStep collectionStep, IStep step1);
    }
}
