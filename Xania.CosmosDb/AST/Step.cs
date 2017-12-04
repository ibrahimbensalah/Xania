namespace Xania.CosmosDb.AST
{
    public interface IStep
    {
        string ToGremlin();
    }

    public interface ITraversal: IStep
    {
        Selector Selector { get; }
    }

    public class Selector: IStep
    {
        public string ToGremlin()
        {
            throw new System.NotImplementedException();
        }
    }
}
