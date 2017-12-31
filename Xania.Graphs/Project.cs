using System;
using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class Project: IStep
    {
        public Dictionary<string, GraphTraversal> Dict { get; }

        public Project(Dictionary<string, GraphTraversal> dict)
        {
            Dict = dict ?? throw new ArgumentNullException(nameof(dict));
        }

        public override string ToString()
        {
            return $"project({Dict.Keys.Select(e => $"'{e}'").Join(", ")})" +
                   $".by(coalesce({Dict.Values.Join(", constant())).by(coalesce(")}, constant()))";
        }
    }
}
