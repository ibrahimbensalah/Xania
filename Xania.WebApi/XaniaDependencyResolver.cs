using System;
using System.Collections.Generic;
using System.Web;
using Xania.IoC;
using Xania.IoC.Resolvers;

namespace Xania.WebApi
{
    public partial class XaniaDependencyResolver : ResolverCollection
    {
		IResolver Resolver { get { return this; } }

        public virtual object GetService(Type serviceType)
        {
            return Resolver.GetService(serviceType);
        }

        public IEnumerable<object> GetServices(Type serviceType)
        {
            return Resolver.GetServices(serviceType);
        }
    }

    public static class XaniaResolverExtensions
    {
        public static IResolver PerRequest(this IResolver resolver, HttpApplication app)
        {
            var scopeProvider = ScopeProvider.FromBackingStore(() => app.Context.Items);
            app.EndRequest += (sender, args) =>
            {
                scopeProvider.Release();
            };
            return resolver.PerScope(scopeProvider);
        }

        public static IResolver PerSession(this IResolver resolver, HttpApplication app)
        {
            return resolver.PerScope(new PerSessionScopeProvider());
        }
    }

    public class PerSessionScopeProvider : ScopeProvider
    {
        public PerSessionScopeProvider()
            : base(GetBackingStore(Guid.NewGuid().ToString()))
        {
        }

        private static Func<IDictionary<Type, object>> GetBackingStore(string id)
        {
			return () => 
			{
				var session = HttpContext.Current.Session;
				var store = session[id] as IDictionary<Type, object>;
				if (store == null)
					session[id] = store = new Dictionary<Type, object>();
				return store;
			};
        }
    }
}