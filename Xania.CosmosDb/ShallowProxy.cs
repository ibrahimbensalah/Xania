using System;
using System.Runtime.Remoting.Messaging;
using System.Runtime.Remoting.Proxies;
using System.Security.Permissions;
using Newtonsoft.Json;

namespace Xania.CosmosDb
{
    public interface InterfaceProxy { }

    [JsonConverter(typeof(ProxyJsonConverter))]
    internal class ShallowProxy: RealProxy
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
            if (myIMessage is IMethodCallMessage)
            {
                var methodCall = (IMethodCallMessage) myIMessage;
                if (methodCall.MethodName.Equals("GetType"))
                    return new ReturnMessage(typeof(ShallowProxy), null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("get_Id", StringComparison.OrdinalIgnoreCase))
                    return new ReturnMessage(_id, null, 0, methodCall.LogicalCallContext, methodCall);
                if (methodCall.MethodName.Equals("ToString"))
                    return new ReturnMessage(ToString(), null, 0, methodCall.LogicalCallContext, methodCall);
            }

            throw new InvalidOperationException("Cannot call shallow object");
        }

        public override string ToString()
        {
            return $"{{Id: {_id}}}";
        }
    }

    internal class ProxyJsonConverter: JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            writer.WriteValue($"[Proxy {value} ]");
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert(Type objectType)
        {
            throw new NotImplementedException();
        }
    }
}
