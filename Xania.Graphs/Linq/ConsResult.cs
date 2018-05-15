//using System;
//using System.Collections.Generic;
//using Xania.Reflection;

//namespace Xania.Graphs.Linq
//{
//    public class ConsResult : IExecuteResult
//    {
//        public object Value { get; }

//        public ConsResult(object value)
//        {
//            Value = value;
//        }

//        public IExecuteResult Execute(IStep step, IEnumerable<(string name, IExecuteResult result)> mappings)
//        {
//            throw new NotImplementedException();
//        }

//        public object ToClrType(Type elementType, Graph graph)
//        {
//            return Value.Convert(elementType);
//        }
//    }
//}