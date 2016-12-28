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
            var type = typeof value;
            if (type !== "object")
                return value;
            var target = value[this.$target];
            if (!!target) {
                return target;
            }
            if (Array.isArray(value)) {
                for (var i = 0; i < value.length; i++) {
                    // TODO, refactor .value
                    value[i] = this.$unwrap(value[i]);
                }
            }
            return value;
        };
        Zone.prototype.has = function (target, name) {
            return true;
        };
        Zone.prototype.get = function (target, name) {
            var _this = this;
            if (name === "$handler")
                return this;
            if (name === "$target")
                return target;
            if (name === this.$target)
                return target;
            if (name === (window["Symbol"]).toPrimitive)
                return function () { return target.valueOf(); };
            var value = this.runtime.get(target, name);
            if (typeof value === "function") {
                return function () {
                    return _this.runtime.invoke(target, value);
                };
            }
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
                result = func.invoke(xs);
            }
            return this.$unwrap(result);
        };
        return Zone;
    }());
    Xania.Zone = Zone;
})(Xania || (Xania = {}));
//# sourceMappingURL=zone.js.map