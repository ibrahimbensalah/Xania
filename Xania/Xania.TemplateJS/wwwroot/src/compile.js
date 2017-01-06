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
        var Scope = (function () {
            function Scope(parent, globals) {
                if (parent === void 0) { parent = DefaultScope; }
                if (globals === void 0) { globals = {}; }
                this.parent = parent;
                this.globals = globals;
                this.scope = {};
            }
            Scope.prototype.set = function (name, value) {
                if (value === undefined) {
                    throw new Error("value is undefined");
                }
                if (this.variable(name) !== undefined) {
                    throw new Error("modifying value is not permitted.");
                }
                this.scope[name] = value;
                return this;
            };
            Scope.prototype.get = function (object, name) {
                return this.parent.get(object, name);
            };
            Scope.prototype.variable = function (name) {
                var value;
                value = this.scope[name];
                if (value !== undefined) {
                    return value;
                }
                value = this.globals[name];
                if (value !== undefined) {
                    return value;
                }
                return this.parent.variable(name);
            };
            return Scope;
        }());
        Compile.Scope = Scope;
        var DefaultScope = (function () {
            function DefaultScope() {
            }
            DefaultScope.get = function (context, name) {
                var value = context[name];
                if (typeof value === "function")
                    value = value.bind(context);
                return value;
            };
            DefaultScope.apply = function (fun, args, context) {
                return fun.apply(context, args);
            };
            DefaultScope.variable = function (name) {
                return window[name];
            };
            return DefaultScope;
        }());
        var Ident = (function () {
            function Ident(name) {
                this.name = name;
            }
            Ident.prototype.execute = function (scope) {
                return scope.variable(this.name);
            };
            Ident.prototype.toString = function () { return this.name; };
            Ident.prototype.app = function (args) {
                return new App(this, args);
            };
            return Ident;
        }());
        Compile.Ident = Ident;
        var Member = (function () {
            function Member(target, member) {
                this.target = target;
                this.member = member;
            }
            Member.prototype.execute = function (scope) {
                if (scope === void 0) { scope = DefaultScope; }
                var obj = this.target.execute(scope);
                if (typeof this.member === "string")
                    return scope.get(obj, this.member);
                return this.member.execute(new Scope(scope, obj));
            };
            Member.prototype.toString = function () {
                return this.target + "." + this.member;
            };
            Member.prototype.app = function (args) {
                return new App(this, args);
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
            Lambda.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                return function () {
                    var models = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        models[_i] = arguments[_i];
                    }
                    var childScope = new Scope(scope);
                    for (var i = 0; i < _this.modelNames.length; i++) {
                        var n = _this.modelNames[i];
                        var v = models[i];
                        if (v === undefined)
                            throw new Error("value of " + n + " is undefined :: " + _this.toString());
                        childScope.set(n, v);
                    }
                    return _this.body.execute(childScope);
                };
            };
            Lambda.prototype.app = function (args) {
                if (args.length !== this.modelNames.length)
                    throw new Error("arguments mismatch");
                return new App(this, args);
            };
            Lambda.prototype.toString = function () {
                return "(fun " + this.modelNames.join(" ") + " -> " + this.body + ")";
            };
            Lambda.member = function (name) {
                return new Lambda(["m"], new Member(new Ident("m"), new Ident(name)));
            };
            return Lambda;
        }());
        Compile.Lambda = Lambda;
        var Const = (function () {
            function Const(value, display) {
                this.value = value;
                this.display = display;
            }
            Const.prototype.execute = function (scope) {
                return this.value;
            };
            Const.prototype.toString = function () {
                return this.display || this.value;
            };
            Const.prototype.app = function (args) {
                return new App(this, args);
            };
            return Const;
        }());
        Compile.Const = Const;
        var Pipe = (function () {
            function Pipe(left, right) {
                this.left = left;
                this.right = right;
            }
            Pipe.prototype.execute = function (scope) {
                if (scope === void 0) { scope = DefaultScope; }
                return this.right.app([this.left]).execute(scope);
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
            Select.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                return this.query.execute(scope).map(function (scope) { return _this.selector.execute(scope); });
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
            Where.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                return this.query.execute(scope).filter(function (scope) { return _this.predicate.execute(scope); });
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
            OrderBy.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                return this.query.execute(scope).sort(function (x, y) { return _this.selector.execute(x) > _this.selector.execute(y) ? 1 : -1; });
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
        }(Scope));
        var GroupBy = (function () {
            function GroupBy(query, selector, into) {
                this.query = query;
                this.selector = selector;
                this.into = into;
            }
            GroupBy.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                var groups = [];
                this.query.execute(scope).forEach(function (scope) {
                    var key = _this.selector.execute(scope);
                    var g = null;
                    for (var i = 0; i < groups.length; i++) {
                        if (groups[i].key === key) {
                            g = groups[i];
                        }
                    }
                    if (!g)
                        groups.push(g = new Group(scope, key, _this.into));
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
            Query.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                var source = this.sourceExpr.execute(scope);
                return source.map(function (item) { return new Scope(scope).set(_this.itemName, item); });
            };
            Query.prototype.toString = function () {
                return "for " + this.itemName + " in " + this.sourceExpr + " do";
            };
            return Query;
        }());
        Compile.Query = Query;
        var App = (function () {
            function App(fun, args) {
                if (args === void 0) { args = []; }
                this.fun = fun;
                this.args = args;
            }
            App.prototype.execute = function (scope) {
                if (scope === void 0) { scope = DefaultScope; }
                var args = this.args.map(function (x) { return x.execute(scope); });
                var fun = this.fun.execute(scope);
                return fun.apply(null, args);
            };
            App.prototype.toString = function () {
                if (this.args.length === 0)
                    return this.fun.toString() + " ()";
                return this.fun.toString() + " " + this.args.map(function (x) { return x.toString(); }).join(" ") + "";
            };
            App.prototype.app = function (args) {
                return new App(this.fun, this.args.concat(args));
            };
            return App;
        }());
        Compile.App = App;
        var Unary = (function () {
            function Unary(fun, args) {
                this.fun = fun;
                this.args = args;
            }
            Unary.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                return function (arg) {
                    var args = _this.args.map(function (x) { return x.execute(scope); });
                    args.push(arg);
                    var fun = _this.fun.execute(scope);
                    return fun.apply(null, args);
                };
            };
            Unary.prototype.app = function (args) {
                if (!!args || args.length === 0)
                    return this;
                if (args.length === 1)
                    return new App(this.fun, this.args.concat(args));
                throw new Error("Too many arguments");
            };
            return Unary;
        }());
        Compile.Unary = Unary;
        var Binary = (function () {
            function Binary(fun, args) {
                this.fun = fun;
                this.args = args;
            }
            Binary.prototype.execute = function (scope) {
                var _this = this;
                if (scope === void 0) { scope = DefaultScope; }
                return function (x, y) {
                    var args = _this.args.map(function (x) { return x.execute(scope); });
                    args.push(x, y);
                    var fun = _this.fun.execute(scope);
                    return fun.apply(null, args);
                };
            };
            Binary.prototype.app = function (args) {
                if (!!args || args.length === 0)
                    return this;
                if (args.length === 1)
                    return new Unary(this.fun, this.args.concat(args));
                if (args.length === 2)
                    return new App(this.fun, this.args.concat(args));
                throw new Error("Too many arguments");
            };
            return Binary;
        }());
        Compile.Binary = Binary;
        var Not = (function () {
            function Not(expr) {
                this.expr = expr;
            }
            Not.inverse = function (x) {
                return !x;
            };
            Not.prototype.execute = function (scope) {
                if (scope === void 0) { scope = DefaultScope; }
                var value = this.expr.execute(scope);
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