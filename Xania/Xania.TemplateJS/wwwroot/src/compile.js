var Xania;
(function (Xania) {
    var Compile;
    (function (Compile) {
        var DefaultRuntimeProvider = (function () {
            function DefaultRuntimeProvider() {
            }
            DefaultRuntimeProvider.prop = function (context, name) {
                return context[name];
            };
            DefaultRuntimeProvider.apply = function (fun, args) {
                return fun.apply(null, args);
            };
            DefaultRuntimeProvider.global = function (name) {
                return window[name];
            };
            return DefaultRuntimeProvider;
        }());
        var Ident = (function () {
            function Ident(name) {
                this.name = name;
            }
            Ident.prototype.compile = function (runtimeProvider) {
                return runtimeProvider.global(this.name);
            };
            Ident.prototype.toString = function () { return this.name; };
            return Ident;
        }());
        Compile.Ident = Ident;
        var Member = (function () {
            function Member(name) {
                this.name = name;
            }
            Member.prototype.compile = function (runtimeProvider) {
                var _this = this;
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                return function (obj) { return runtimeProvider.prop(obj, _this.name); };
            };
            Member.prototype.toString = function () {
                return "(." + this.name + ")";
            };
            return Member;
        }());
        Compile.Member = Member;
        var Const = (function () {
            function Const(value, display) {
                this.value = value;
                this.display = display;
            }
            Const.prototype.compile = function (runtimeProvider) {
                return this.value;
            };
            Const.prototype.toString = function () {
                return this.display || this.value;
            };
            return Const;
        }());
        Compile.Const = Const;
        var Pipe = (function () {
            function Pipe(left, right) {
                this.left = left;
                this.right = right;
            }
            Pipe.prototype.compile = function (runtimeProvider) {
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                var leftResult = this.left.compile(runtimeProvider);
                var rightResult = this.right.compile(runtimeProvider);
                return function () {
                    var data = typeof leftResult === "function" ? leftResult() : leftResult;
                    return rightResult(data);
                };
            };
            Pipe.prototype.toString = function () {
                return "(" + this.left + " |> " + this.right + " )";
            };
            return Pipe;
        }());
        Compile.Pipe = Pipe;
        var App = (function () {
            function App(fun, args) {
                this.fun = fun;
                this.args = args;
            }
            App.prototype.compile = function (runtimeProvider) {
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                var args = this.args.map(function (x) { return x.compile(runtimeProvider); });
                var fun = !!this.fun.compile ? this.fun.compile(runtimeProvider) : this.fun;
                return function (additionalArg) {
                    if (additionalArg === void 0) { additionalArg = []; }
                    return runtimeProvider.apply(fun, args.concat([additionalArg]));
                };
            };
            App.prototype.toString = function () {
                return this.fun.toString() + " " + this.args.map(function (x) { return x.toString(); }).join(" ") + "";
            };
            return App;
        }());
        Compile.App = App;
        var Not = (function () {
            function Not(expr) {
                this.expr = expr;
            }
            Not.inverse = function (x) {
                return !x;
            };
            Not.prototype.compile = function (runtimeProvider) {
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                var value = this.expr.compile(runtimeProvider);
                if (typeof value === "function")
                    return function (obj) { return !value(obj); };
                return !value;
            };
            Not.prototype.toString = function () {
                return "(not " + this.expr.toString() + ")";
            };
            return Not;
        }());
        Compile.Not = Not;
    })(Compile = Xania.Compile || (Xania.Compile = {}));
})(Xania || (Xania = {}));
//# sourceMappingURL=compile.js.map