using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using Newtonsoft.Json;
using Xania.ObjectMapper;

namespace Xania.Graphs.Linq
{
    internal class AnonymousQuery : IGraphQuery
    {
        private readonly Graph _graph;

        public AnonymousQuery(Graph graph, Expression sourceExpr)
        {
            _graph = graph;
            SourceExpression = sourceExpr;
        }

        public object Execute(Type elementType)
        {
            var func = Expression.Lambda(SourceExpression).Compile();
            var list = new List<object>();
            var result = func.DynamicInvoke();
            Console.WriteLine(JsonConvert.SerializeObject(result, Formatting.Indented));

            var mapper = new Mapper(new VertexMappingResolver(_graph));

            foreach (var o in (IEnumerable<object>) result)
            {
                list.Add(mapper.MapTo(o, elementType));
            }

            return list;
        }

        public IGraphQuery Next(Type sourceType, IStep step, IEnumerable<(string name, Expression result)> mappings)
        {
            if (step is Out o)
            {
                return SelectProperty(sourceType, o.EdgeLabel);
            }
            if (step is Values val)
            {
                return SelectProperty(sourceType, val.Name);
            }

            throw new NotSupportedException($"{step.GetType()}");
        }

        private IGraphQuery SelectProperty(Type sourceType, string propertyName)
        {
            var property = TypeDescriptor.GetProperties(sourceType)
                .OfType<PropertyDescriptor>()
                .First(p => p.Name.Equals(propertyName, StringComparison.InvariantCultureIgnoreCase));

            var param = Expression.Parameter(sourceType);
            var propertyExpr = Expression.Property(param, property.Name);

            return MemberStep.Query(_graph, Expression.Lambda(propertyExpr, param), SourceExpression);
        }

        public Expression SourceExpression { get; }
    }
}