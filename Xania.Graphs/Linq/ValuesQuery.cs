using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Newtonsoft.Json;
using Xania.Graphs.Gremlin;
using Xania.Graphs.Structure;
using Xania.ObjectMapper;

namespace Xania.Graphs.Linq
{
    public class ValuesQuery : IGraphQuery
    {
        public ValuesQuery(Graph graph, Expression sourceExpression)
        {
            Graph = graph;
            SourceExpression = sourceExpression;
        }

        public object Execute(Type elementType)
        {
            var func = Expression.Lambda(SourceExpression).Compile();
            var list = new List<object>();
            var result = func.DynamicInvoke();
            Console.WriteLine("======================================================");
            Console.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));
            Console.WriteLine("======================================================");

            var mapper = new Mapper(new GraphMappingResolver(Graph));

            foreach (var o in (IEnumerable)result)
            {
                list.Add(mapper.MapTo(o, elementType));
            }

            return list;
        }

        public IGraphQuery Next(Type sourceType, IStep step, IEnumerable<(string name, Expression result)> mappings)
        {
            //if (step is Values values)
            //{
            //    var propertyName = values.Name;
            //    var expr = SourceExpression.OfType<GraphObject>().SelectMany((GraphObject go) =>
            //        go.Properties
            //            .Where(p => string.Equals(p.Name, propertyName, StringComparison.InvariantCultureIgnoreCase))
            //            .Select(p => p.Value)
            //    );

            //    return new ValuesQuery(Graph, expr);
            //}

            throw new NotImplementedException($"Next {step.GetType()}");
        }

        public Graph Graph { get; }
        public Expression SourceExpression { get; }

        public static object GetMember(object v, string name, Type memberType)
        {
            if (v is Vertex vtx && name.Equals("id", StringComparison.InvariantCultureIgnoreCase))
            {
                return vtx.Id;
            }

            if (v is Vertex obj)
            {
                return obj.Properties.Where(p => p.Name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                    .Select(p => p.Value).FirstOrDefault();
            }

            throw new NotImplementedException();
        }
    }
}