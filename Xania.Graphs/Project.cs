using System;
using System.Collections.Generic;
using System.Linq;

namespace Xania.Graphs
{
    public class Project : IStep
    {
        public Dictionary<string, GraphTraversal> Dict { get; }

        public Project(Dictionary<string, GraphTraversal> dict)
        {
            Dict = dict ?? throw new ArgumentNullException(nameof(dict));
        }

        public override string ToString()
        {
            return $"project({Dict.Keys.Select(e => $"'{e}'").Join(", ")})." + Dict.Values.Select(By).Join(".");
            // $".by(coalesce({Dict.Values.Join(", constant())).by(coalesce(")}, constant()))";
        }

        public string By(GraphTraversal traversal)
        {
            if (traversal.Steps.Count() == 1 && traversal.Steps.First() is Context)
                return $"by({GraphTraversal.__})";
            return $"by(coalesce({traversal}, constant()))";
        }
    }
}
