using System;
using System.ComponentModel;
using System.Runtime.Remoting.Messaging;
using System.Runtime.Remoting.Proxies;
using System.Security.Permissions;

namespace Xania.Graphs.Structure
{
    internal class ShallowProxy : RealProxy
    {
        private readonly object _id;

        [PermissionSet(SecurityAction.LinkDemand)]
        public ShallowProxy(Type myType, object id) : base(myType)
        {
            _id = id;
        }

        [SecurityPermission(SecurityAction.LinkDemand, Flags = SecurityPermissionFlag.Infrastructure)]
        public override IMessage Invoke(IMessage myIMessage)
        {
            if (myIMessage is IMethodCallMessage methodCall)
            {
                if (methodCall.MethodName.Equals("GetType"))
                    return new ReturnMessage(GetProxiedType(), null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("get_Id", StringComparison.OrdinalIgnoreCase))
                    return new ReturnMessage(_id, null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("ToString"))
                    return new ReturnMessage(ToString(), null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("Equals"))
                    return new ReturnMessage(Equals(methodCall.InArgs[0]), null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("GetHashCode"))
                    return new ReturnMessage(0, null, 0, methodCall.LogicalCallContext, methodCall);
            }

            throw new InvalidOperationException("Cannot call shallow object");
        }

        public override string ToString()
        {
            return $"{{Id: {_id}}}";
        }

        public override bool Equals(object o)
        {
            return o == this;
        }
    }
}