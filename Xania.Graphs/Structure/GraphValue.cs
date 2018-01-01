namespace Xania.Graphs.Structure
{
    /// <summary>
    /// Discriminated Union
    /// </summary>
    public abstract class GraphValue
    {
        public static GraphPrimitive<int> Int(int value)
        {
            return new GraphPrimitive<int>(value);
        }

        public abstract object ToClType();
    }
}