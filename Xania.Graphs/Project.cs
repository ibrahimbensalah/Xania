using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class Project: IStep
    {
        private readonly Dictionary<string, GraphTraversal> _dict;

        public Project(Dictionary<string, GraphTraversal> dict)
        {
            _dict = dict;
        }

        public override string ToString()
        {
            return $"project({_dict.Keys.Select(e => $"'{e}'").Join(", ")})" +
                   $".by(coalesce({_dict.Values.Join(", constant())).by(coalesce(")}, constant()))";
        }
    }
}
