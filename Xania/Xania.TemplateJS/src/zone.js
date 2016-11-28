var Xania;
(function (Xania) {
    var Zone = (function () {
        function Zone(runtime) {
            this.runtime = runtime;
            this.$target = (window["Symbol"])("target");
            this.$cache = new Map();
        }
        Zone.prototype.$wrap = function (object) {
            var type = typeof object;
            if (object === null || type === "function" || type === "undefined" || type === "boolean" || type === "number" || type === "string")
                return object;
            var proxy = this.$cache.get(object);
            if (!proxy) {
                proxy = this.$proxy(object);
                this.$cache.set(object, proxy);
            }
            return proxy;
        };
        Zone.prototype.$unwrap = function (value) {
            return (!!value && value[this.$target]) || value;
        };
        Zone.prototype.has = function (target, name) {
            return true;
        };
        Zone.prototype.get = function (target, name) {
            if (name === this.$target)
                return target;
            if (name === (window["Symbol"]).toPrimitive)
                return function () { return target.valueOf(); };
            var value = this.runtime.get(target, name);
            return this.$wrap(value);
        };
        Zone.prototype.set = function (target, name, value) {
            this.runtime.set(target, name, this.$unwrap(value));
            return true;
        };
        Zone.prototype.apply = function (target, thisArg, args) {
            return target.apply(thisArg, args);
        };
        Zone.prototype.$proxy = function (object) {
            var Proxy = window['Proxy'];
            return new Proxy(object, this);
        };
        Zone.prototype.run = function (func, context, args) {
            var _this = this;
            if (args === void 0) { args = []; }
            var xs = args.map(function (x) { return _this.$wrap(x); });
            var result;
            if (typeof func === "function") {
                var ctx = this.$wrap(context);
                result = func.apply(ctx, xs);
            }
            else {
                var ctx = this.$wrap(func);
                result = func.invoke(xs);
            }
            return this.$unwrap(result);
        };
        return Zone;
    }());
    Xania.Zone = Zone;
})(Xania || (Xania = {}));
//# sourceMappingURL=zone.js.map