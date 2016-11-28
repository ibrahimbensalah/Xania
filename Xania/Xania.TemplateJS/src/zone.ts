module Xania {
    export class Zone {
        private $target = (window["Symbol"])("target");
        private $cache = new Map();

        constructor(private runtime: { get: Function, set: Function }) {
        }

        $wrap(object) {
            var type = typeof object;
            if (object === null || type === "function" || type === "undefined" || type === "boolean" || type === "number" || type === "string")
                return object;

            var proxy = this.$cache.get(object);
            if (!proxy) {
                proxy = this.$proxy(object);
                this.$cache.set(object, proxy);
            }

            return proxy;
        }
        $unwrap(value) {
            return (!!value && value[this.$target]) || value;
        }
        has(target, name) {
            return true;
        }
        get(target, name) {
            if (name === this.$target)
                return target;
            if (name === (window["Symbol"]).toPrimitive)
                return () => target.valueOf();

            var value = this.runtime.get(target, name);
            return this.$wrap(value);
        }
        set(target, name, value) {
            this.runtime.set(target, name, this.$unwrap(value));
            return true;
        }
        apply(target, thisArg, args) {
            return target.apply(thisArg, args);
        }
        $proxy(object) {
            var Proxy = window['Proxy'];
            return new Proxy(object, this);
        }
        run(func, context, args = []) {
            var xs = args.map(x => this.$wrap(x));

            var result;

            if (typeof func === "function") {
                let ctx = this.$wrap(context);
                result = func.apply(ctx, xs);
            } else {
                let ctx = this.$wrap(func);
                result = func.invoke(xs);
            }

            return this.$unwrap(result);
        }
    }
}

