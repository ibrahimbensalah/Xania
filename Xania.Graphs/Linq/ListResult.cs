//using System;
//using System.Collections.Generic;
//using Xania.Graphs.Structure;

//namespace Xania.Graphs.Linq
//{
//    public class ListResult : IExecuteResult
//    {
//        public IEnumerable<IExecuteResult> Items { get; }
//        private readonly Graph _graph;

//        public ListResult(IEnumerable<IExecuteResult> items, Graph graph)
//        {
//            Items = items;
//            _graph = graph;
//        }

//        public IExecuteResult Execute(IStep step, IEnumerable<(string name, IExecuteResult result)> mappings)
//        {
//            //if (step is V || step is Has || step is Where)
//            //{
//            //    var items = Items.Where(itemResult =>
//            //        Equals(itemResult.Execute(step, mappings).ToClrType(typeof(bool), _graph), true)
//            //    );
//            //    return new ListResult(items, _graph);
//            //}


//            //if (step is Values)
//            //{
//            //    var items = Items.Select(itemResult => itemResult.Execute(step, mappings));
//            //    return new ListResult(items, _graph);
//            //}

//            //if (step is Out)
//            //{
//            //    var r = Items.SelectMany(from =>
//            //    {
//            //        var result = from.Execute(step, mappings);
//            //        if (result is VerticesResult verticesResult)
//            //            return verticesResult.Vertices;
//            //        if (result is GraphList list)
//            //            return list.Items;
//            //        if (result == null)
//            //            return Enumerable.Empty<IExecuteResult>();

//            //        throw new NotSupportedException();
//            //    });
//            //    return new ListResult(r, _graph);
//            //}

//            //if (step is Project project)
//            //{
//            //    var properties = Items.Select(vertex => new ObjectResult(
//            //        project.Dict.ToDictionary(kvp => kvp.Key, kvp => vertex.Execute(kvp.Value, mappings))
//            //    ));

//            //    return new ListResult(properties, _graph);
//            //}

//            throw new NotImplementedException($"Execute {step.GetType()}");
//        }

//        public object ToClrType(Type elementType, Graph graph)
//        {
//            throw new NotImplementedException($"ListResult.ToClrType");
//        }
//    }
//}