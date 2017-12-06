namespace Xania.CosmosDb.AST
{
    public interface IExpr
    {
        string ToGremlin();
    }

    public interface ITraversal: IExpr
    {
        Selector Selector { get; }
    }

    public class Selector: IExpr
    {
        public string ToGremlin()
        {
            throw new System.NotImplementedException();
        }
    }
}
