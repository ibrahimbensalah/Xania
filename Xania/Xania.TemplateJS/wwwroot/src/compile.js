var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Xania;
(function (Xania) {
    var Compile;
    (function (Compile) {
        var undefined = void 0;
        var ScopeRuntime = (function () {
            function ScopeRuntime(parent, values) {
                if (parent === void 0) { parent = DefaultRuntime; }
                if (values === void 0) { values = {}; }
                this.parent = parent;
                this.values = values;
            }
            ScopeRuntime.prototype.set = function (name, value) {
                if (value === undefined) {
                    throw new Error("value is undefined");
                }
                this.values[name] = value;
                return this;
            };
            ScopeRuntime.prototype.prop = function (object, name) {
                return this.parent.prop(object, name);
            };
            ScopeRuntime.prototype.apply = function (fun, args, context) {
                return this.parent.apply(fun, args, context);
            };
            ScopeRuntime.prototype.global = function (name) {
                var value = this.values[name];
                if (value !== undefined) {
                    return value;
                }
                return this.parent.global(name);
            };
            return ScopeRuntime;
        }());
        Compile.ScopeRuntime = ScopeRuntime;
        var DefaultRuntime = (function () {
            function DefaultRuntime() {
            }
            DefaultRuntime.prop = function (context, name) {
                return context[name];
            };
            DefaultRuntime.apply = function (fun, args, context) {
                return fun.apply(context, args);
            };
            DefaultRuntime.global = function (name) {
                return window[name];
            };
            return DefaultRuntime;
        }());
        var Ident = (function () {
            function Ident(name) {
                this.name = name;
            }
            Ident.prototype.execute = function (runtime) {
                return runtime.global(this.name);
            };
            Ident.prototype.toString = function () { return this.name; };
            Ident.prototype.app = function (args) {
                return new App(this, args, null);
            };
            return Ident;
        }());
        Compile.Ident = Ident;
        var Member = (function () {
            function Member(target, name) {
                this.target = target;
                this.name = name;
            }
            Member.prototype.execute = function (runtime) {
                if (runtime === void 0) { runtime = DefaultRuntime; }
                var obj = this.target.execute(runtime);
                return runtime.prop(obj, this.name);
            };
            Member.prototype.toString = function () {
                return this.target + "." + this.name;
            };
            Member.prototype.app = function (args) {
                return new App(new Ident(this.name), args, this.target);
            };
            return Member;
        }());
        Compile.Member = Member;
        var ModelParameter = (function () {
            function ModelParameter(name) {
                this.name = name;
            }
            ModelParameter.prototype.toString = function () {
                return this.name;
            };
            return ModelParameter;
        }());
        Compile.ModelParameter = ModelParameter;
        var Lambda = (function () {
            function Lambda(modelNames, body) {
                this.modelNames = modelNames;
                this.body = body;
            }
            Lambda.prototype.execute = function (runtime) {
                var _this = this;
                if (runtime === void 0) { runtime = DefaultRuntime; }
                return function () {
                    var models = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        models[_i] = arguments[_i];
                    }
                    var scope = new ScopeRuntime(runtime);
                    for (var i = 0; i < _this.modelNames.length; i++) {
                        var n = _this.modelNames[i];
                        var v = models[i];
                        if (v === undefined)
                            throw new Error("value of " + n + " is undefined :: " + _this.toString());
                        scope.set(n, v);
                    }
                    return _this.body.execute(scope);
                };
            };
            Lambda.prototype.app = function (args) {
                if (args.length !== this.modelNames.length)
                    throw new Error("arguments mismatch");
                return new App(this, args, null);
            };
            Lambda.prototype.toString = function () {
                return "(fun " + this.modelNames.join(" ") + " -> " + this.body + ")";
            };
            Lambda.member = function (name) {
                return new Lambda(["m"], new Member(new Ident("m"), name));
            };
            return Lambda;
        }());
        Compile.Lambda = Lambda;
        var Const = (function () {
            function Const(value, display) {
                this.value = value;
                this.display = display;
            }
            Const.prototype.execute = function (runtime) {
                return this.value;
            };
            Const.prototype.toString = function () {
                return this.display || this.value;
            };
            Const.prototype.app = function (args) {
                return new App(this, args, null);
            };
            return Const;
        }());
        Compile.Const = Const;
        var Pipe = (function () {
            function Pipe(left, right) {
                this.left = left;
                this.right = right;
            }
            Pipe.prototype.execute = function (runtime) {
                if (runtime === void 0) { runtime = DefaultRuntime; }
                return this.right.app([this.left]).execute(runtime);
            };
            Pipe.prototype.toString = function () {
                return "" + this.left + " |> " + this.right + "";
            };
            Pipe.prototype.app = function (args) {
                throw new Error("Not supported");
            };
            return Pipe;
        }());
        Compile.Pipe = Pipe;
        var Select = (function () {
            function Select(query, selector) {
                this.query = query;
                this.selector = selector;
            }
            Select.prototype.execute = function (runtime) {
                var _this = this;
                if (runtime === void 0) { runtime = DefaultRuntime; }
                return this.query.execute(runtime).map(function (scope) { return _this.selector.execute(scope); });
            };
            Select.prototype.toString = function () {
                return this.query + " select " + this.selector;
            };
            Select.prototype.app = function (args) {
                throw new Error("Not supported");
            };
            return Select;
        }());
        Compile.Select = Select;
        var Where = (function () {
            function Where(query, predicate) {
                this.query = query;
                this.predicate = predicate;
            }
            Where.prototype.execute = function (runtime) {
                var _this = this;
                if (runtime === void 0) { runtime = DefaultRuntime; }
                return this.query.execute(runtime).filter(function (scope) { return _this.predicate.execute(scope); });
            };
            Where.prototype.toString = function () {
                return this.query + " where " + this.predicate;
            };
            return Where;
        }());
        Compile.Where = Where;
        var OrderBy = (function () {
            function OrderBy(query, selector) {
                this.query = query;
                this.selector = selector;
            }
            OrderBy.prototype.execute = function (runtime) {
                var _this = this;
                if (runtime === void 0) { runtime = DefaultRuntime; }
                return this.query.execute(runtime).sort(function (x, y) { return _this.selector.execute(x) > _this.selector.execute(y) ? 1 : -1; });
            };
            OrderBy.prototype.toString = function () {
                return this.query + " orderBy " + this.selector;
            };
            return OrderBy;
        }());
        Compile.OrderBy = OrderBy;
        var Group = (function (_super) {
            __extends(Group, _super);
            function Group(parent, key, into) {
                var _this = _super.call(this, parent) || this;
                _this.key = key;
                _this.into = into;
                _this.scopes = [];
                _super.prototype.set.call(_this, into, _this);
                return _this;
            }
            Group.prototype.count = function () {
                return this.scopes.length;
            };
            return Group;
        }(ScopeRuntime));
        var GroupBy = (function () {
            function GroupBy(query, selector, into) {
                this.query = query;
                this.selector = selector;
                this.into = into;
            }
            GroupBy.prototype.execute = function (runtime) {
                var _this = this;
                if (runtime === void 0) { runtime = DefaultRuntime; }
                var groups = [];
                this.query.execute(runtime).forEach(function (scope) {
                    var key = _this.selector.execute(scope);
                    var g = null;
                    for (var i = 0; i < groups.length; i++) {
                        if (groups[i].key === key) {
                            g = groups[i];
                        }
                    }
                    if (!g)
                        groups.push(g = new Group(runtime, key, _this.into));
                    g.scopes.push(scope);
                });
                return groups;
            };
            GroupBy.prototype.toString = function () {
                return this.query + " groupBy " + this.selector + " into " + this.into;
            };
            return GroupBy;
        }());
        Compile.GroupBy = GroupBy;
        var Query = (function () {
            function Query(itemName, sourceExpr) {
                this.itemName = itemName;
                this.sourceExpr = sourceExpr;
            }
            Query.prototype.execute = function (runtime) {
                var _this = this;
                if (runtime === void 0) { runtime = DefaultRuntime; }
                var source = this.sourceExpr.execute(runtime);
                return source.map(function (item) { return new ScopeRuntime(runtime).set(_this.itemName, item); });
            };
            Query.prototype.toString = function () {
                return "for " + this.itemName + " in " + this.sourceExpr + " do";
            };
            return Query;
        }());
        Compile.Query = Query;
        var App = (function () {
            function App(fun, args, context) {
                if (args === void 0) { args = []; }
                this.fun = fun;
                this.args = args;
                this.context = context;
            }
            App.prototype.execute = function (runtime) {
                if (runtime === void 0) { runtime = DefaultRuntime; }
                var args = this.args.map(function (x) { return x.execute(runtime); });
                if (!!this.context) {
                    var context = this.context.execute(runtime);
                    var scope = new ScopeRuntime(runtime, context);
                    var fun = this.fun.execute(scope);
                    return scope.apply(fun, args, context);
                }
                else {
                    var fun = this.fun.execute(runtime);
                    return runtime.apply(fun, args);
                }
            };
            App.prototype.toString = function () {
                if (this.args.length === 0)
                    return this.fun.toString() + " ()";
                return this.fun.toString() + " " + this.args.map(function (x) { return x.toString(); }).join(" ") + "";
            };
            App.prototype.app = function (args) {
                return new App(this.fun, this.args.concat(args), this.context);
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
            Not.prototype.execute = function (runtime) {
                if (runtime === void 0) { runtime = DefaultRuntime; }
                var value = this.expr.execute(runtime);
                if (typeof value === "function")
                    return function (obj) { return !value(obj); };
                return !value;
            };
            Not.prototype.toString = function () {
                return "(not " + this.expr.toString() + ")";
            };
            Not.prototype.app = function (args) {
                throw new Error("Not supported");
            };
            return Not;
        }());
        Compile.Not = Not;
    })(Compile = Xania.Compile || (Xania.Compile = {}));
})(Xania || (Xania = {}));
//# sourceMappingURL=compile.js.map