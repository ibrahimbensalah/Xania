System.register(["./core"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var core_1;
    var Expression;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            (function (Expression) {
                var undefined = void 0;
                function accept(ast, visitor) {
                    if (visitor === void 0) { visitor = AstVisitor; }
                    if (ast === null || ast === undefined)
                        return null;
                    if (ast.type === undefined)
                        return ast;
                    switch (ast.type) {
                        case "where":
                            return visitor.where(accept(ast.source, visitor), accept(ast.predicate, visitor));
                        case "query":
                            return visitor.query(ast.param, accept(ast.source, visitor));
                        case "ident":
                            return visitor.ident(ast.name);
                        case "member":
                            return visitor.member(accept(ast.target, visitor), accept(ast.member, visitor));
                        case "app":
                            var args = [];
                            for (var i = 0; i < ast.args.length; i++) {
                                args.push(accept(args[i], visitor));
                            }
                            return visitor.app(accept(ast.fun, visitor), args);
                        case "select":
                            return visitor.select(accept(ast.source, visitor), accept(ast.selector, visitor));
                        case "const":
                            return visitor.const(ast.value);
                        default:
                            throw new Error("not supported type " + ast.type);
                    }
                }
                Expression.accept = accept;
                var AstVisitor = (function () {
                    function AstVisitor() {
                    }
                    AstVisitor.where = function (source, predicate) {
                        return new Where(source, predicate);
                    };
                    AstVisitor.select = function (source, selector) {
                        return new Select(source, selector);
                    };
                    AstVisitor.query = function (param, source) {
                        return new Query(param, source);
                    };
                    AstVisitor.ident = function (name) {
                        return new Ident(name);
                    };
                    AstVisitor.member = function (target, name) {
                        return new Member(target, name);
                    };
                    AstVisitor.app = function (fun, args) {
                        return new App(fun, args);
                    };
                    AstVisitor.const = function (value) {
                        return new Const(value);
                    };
                    return AstVisitor;
                }());
                var DefaultScope = (function () {
                    function DefaultScope() {
                    }
                    DefaultScope.get = function (name) {
                        return undefined;
                    };
                    DefaultScope.extend = function (value) {
                        return new core_1.Core.Scope(value, DefaultScope);
                    };
                    return DefaultScope;
                }());
                var Ident = (function () {
                    function Ident(name) {
                        this.name = name;
                        if (typeof name !== "string" || name.length === 0) {
                            throw Error("Argument name is null or empty");
                        }
                    }
                    Ident.prototype.execute = function (scope) {
                        return scope.get(this.name);
                    };
                    Ident.prototype.toString = function () { return this.name; };
                    Ident.prototype.app = function (args) {
                        return new App(this, args);
                    };
                    return Ident;
                }());
                Expression.Ident = Ident;
                var Member = (function () {
                    function Member(target, member) {
                        this.target = target;
                        this.member = member;
                    }
                    Member.prototype.execute = function (scope) {
                        if (scope === void 0) { scope = DefaultScope; }
                        var obj = this.target.execute(scope);
                        if (!obj || !obj.get)
                            throw new Error(this.target + " is null");
                        if (typeof this.member === "string") {
                            return obj.get(this.member);
                        }
                        return this.member.execute(obj);
                    };
                    Member.prototype.toString = function () {
                        return this.target + "." + this.member;
                    };
                    Member.prototype.app = function (args) {
                        return new App(this, args);
                    };
                    return Member;
                }());
                Expression.Member = Member;
                var ModelParameter = (function () {
                    function ModelParameter(name) {
                        this.name = name;
                    }
                    ModelParameter.prototype.toString = function () {
                        return this.name;
                    };
                    return ModelParameter;
                }());
                Expression.ModelParameter = ModelParameter;
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
                                models[_i - 0] = arguments[_i];
                            }
                            var childScope = new core_1.Core.Scope({}, scope);
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
                Expression.Lambda = Lambda;
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
                Expression.Const = Const;
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
                Expression.Pipe = Pipe;
                var Select = (function () {
                    function Select(query, selector) {
                        this.query = query;
                        this.selector = selector;
                    }
                    Select.prototype.execute = function (scope) {
                        var _this = this;
                        if (scope === void 0) { scope = DefaultScope; }
                        return this.query.execute(scope).map(function (s) { return _this.selector.execute(s); });
                    };
                    Select.prototype.toString = function () {
                        return this.query + " select " + this.selector;
                    };
                    Select.prototype.app = function (args) {
                        throw new Error("Not supported");
                    };
                    return Select;
                }());
                Expression.Select = Select;
                var Where = (function () {
                    function Where(query, predicate) {
                        this.query = query;
                        this.predicate = predicate;
                    }
                    Where.prototype.execute = function (scope) {
                        var _this = this;
                        if (scope === void 0) { scope = DefaultScope; }
                        return this.query.execute(scope).filter(function (scope) {
                            return _this.predicate.execute(scope);
                        });
                    };
                    Where.prototype.toString = function () {
                        return this.query + " where " + this.predicate;
                    };
                    return Where;
                }());
                Expression.Where = Where;
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
                Expression.OrderBy = OrderBy;
                var Group = (function (_super) {
                    __extends(Group, _super);
                    function Group(parent, key, into) {
                        _super.call(this, parent, DefaultScope);
                        this.key = key;
                        this.into = into;
                        this.scopes = [];
                        _super.prototype.set.call(this, into, this);
                    }
                    Group.prototype.count = function () {
                        return this.scopes.length;
                    };
                    return Group;
                }(core_1.Core.Scope));
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
                Expression.GroupBy = GroupBy;
                var Query = (function () {
                    function Query(itemName, sourceExpr) {
                        this.itemName = itemName;
                        this.sourceExpr = sourceExpr;
                        if (typeof itemName !== "string" || itemName.length === 0) {
                            throw new Error("itemName is null");
                        }
                    }
                    Query.prototype.execute = function (scope) {
                        var _this = this;
                        if (scope === void 0) { scope = DefaultScope; }
                        var source = this.sourceExpr.execute(scope);
                        return source.map(function (item) {
                            var child = {};
                            child[_this.itemName] = item;
                            return scope.extend(child);
                        });
                    };
                    Query.prototype.toString = function () {
                        return "for " + this.itemName + " in " + this.sourceExpr + " do";
                    };
                    return Query;
                }());
                Expression.Query = Query;
                var App = (function () {
                    function App(fun, args) {
                        if (args === void 0) { args = []; }
                        this.fun = fun;
                        this.args = args;
                    }
                    App.prototype.execute = function (scope) {
                        if (scope === void 0) { scope = DefaultScope; }
                        var args = this.args.map(function (x) { return x.execute(scope).valueOf(); });
                        if (this.fun === "+") {
                            return args[0] + args[1];
                        }
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
                Expression.App = App;
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
                Expression.Unary = Unary;
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
                Expression.Binary = Binary;
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
                Expression.Not = Not;
            })(Expression = Expression || (Expression = {}));
            exports_1("Expression", Expression);
        }
    }
});
//# sourceMappingURL=expression.js.map