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
            DefaultRuntimeProvider.invoke = function (fun, args) {
                return fun.apply(null, args);
            };
            return DefaultRuntimeProvider;
        }());
        var Member = (function () {
            function Member(name) {
                this.name = name;
            }
            Member.prototype.execute = function (context, runtimeProvider) {
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                return runtimeProvider.prop(context, this.name);
            };
            return Member;
        }());
        Compile.Member = Member;
        var Const = (function () {
            function Const(value) {
                this.value = value;
            }
            Const.prototype.execute = function (context, runtimeProvider) {
                return this.value;
            };
            return Const;
        }());
        Compile.Const = Const;
        var Pipe = (function () {
            function Pipe(left, right) {
                this.left = left;
                this.right = right;
            }
            Pipe.prototype.execute = function (context, runtimeProvider) {
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                var leftResult = this.left.execute(context, runtimeProvider);
                return this.right.execute(leftResult, runtimeProvider);
            };
            return Pipe;
        }());
        Compile.Pipe = Pipe;
        var App = (function () {
            function App(fun, args) {
                this.fun = fun;
                this.args = args;
            }
            App.prototype.execute = function (context, runtimeProvider) {
                if (runtimeProvider === void 0) { runtimeProvider = DefaultRuntimeProvider; }
                var args = this.args.map(function (x) { return x.execute(context, runtimeProvider); });
                var fun = !!this.fun.execute ? this.fun.execute(context, runtimeProvider) : this.fun;
                // var fun: Function = this.fun.execute(context, runtimeProvider);
                return runtimeProvider.invoke(fun, args);
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
            Not.prototype.execute = function (context, runtimeProvider) {
            };
            return Not;
        }());
        Compile.Not = Not;
    })(Compile = Xania.Compile || (Xania.Compile = {}));
})(Xania || (Xania = {}));
