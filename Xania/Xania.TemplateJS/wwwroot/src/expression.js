"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Expression;
(function (Expression) {
    var undefined = void 0;
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
    var Scope = (function () {
        function Scope(value, parent) {
            if (value === void 0) { value = {}; }
            this.value = value;
            this.parent = parent;
        }
        Scope.prototype.valueOf = function () {
            return this.value;
        };
        Scope.prototype.map = function (fn) {
            return this.value.map(fn);
        };
        Scope.prototype.extend = function (value) {
            return new Scope(value, this);
        };
        Scope.prototype.set = function (name, value) {
            if (value === undefined) {
                throw new Error("value is undefined");
            }
            if (this.get(name) !== undefined) {
                throw new Error("modifying value is not permitted.");
            }
            this.value[name] = value;
            return this;
        };
        Scope.prototype.get = function (name) {
            var value = this.value[name];
            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);
                return value;
            }
            if (value === null || value instanceof Date)
                return value;
            if (typeof value === "function")
                return value.bind(this.value);
            if (typeof value === "object")
                return new Scope(value, this);
            return value;
        };
        Scope.prototype.toJSON = function () {
            var parent = this.parent;
            if (typeof this._json === "undefined") {
                this._json = "*recursive*";
                this._json = Object.assign({}, this.value, parent.toJSON ? parent.toJSON() : {});
            }
            return this._json;
        };
        Scope.prototype.toString = function () {
            return JSON.stringify(this.toJSON(), null, 4);
        };
        return Scope;
    }());
    Expression.Scope = Scope;
    var DefaultScope = (function () {
        function DefaultScope() {
        }
        DefaultScope.get = function (name) {
            return undefined;
        };
        DefaultScope.extend = function (value) {
            return new Scope(value, DefaultScope);
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
                    models[_i] = arguments[_i];
                }
                var childScope = new Scope({}, scope);
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
            var _this = _super.call(this, parent, DefaultScope) || this;
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
})(Expression = exports.Expression || (exports.Expression = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHByZXNzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLElBQWMsVUFBVSxDQStjdkI7QUEvY0QsV0FBYyxVQUFVO0lBQ3BCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBRXZCO1FBQUE7UUE0QkEsQ0FBQztRQTNCVSxnQkFBSyxHQUFaLFVBQWEsTUFBTSxFQUFFLFNBQVM7WUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU0saUJBQU0sR0FBYixVQUFjLE1BQU0sRUFBRSxRQUFRO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVNLGdCQUFLLEdBQVosVUFBYSxLQUFLLEVBQUUsTUFBTTtZQUN0QixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTSxnQkFBSyxHQUFaLFVBQWEsSUFBSTtZQUNiLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRU0saUJBQU0sR0FBYixVQUFjLE1BQU0sRUFBRSxJQUFJO1lBQ3RCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLGNBQUcsR0FBVixVQUFXLEdBQUcsRUFBRSxJQUFXO1lBQ3ZCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVNLGdCQUFLLEdBQVosVUFBYSxLQUFLO1lBQ2QsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFDTCxp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NUIsc0JBQUEsRUFBQSxvQkFBNEI7WUFDaEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO2dCQUM1QixNQUFNLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBWCxDQUFXLENBQUM7WUFDOUIsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxzQkFBUSxHQUFSO1lBQ0ksTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQztRQUNoRCxDQUFDO1FBRUQsaUJBQUcsR0FBSCxVQUFJLElBQWE7WUFDYixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFDTCxVQUFDO0lBQUQsQ0FBQyxBQXZCRCxJQXVCQztJQXZCWSxjQUFHLE1BdUJmLENBQUE7QUFHTCxDQUFDLEVBL2NhLFVBQVUsR0FBVixrQkFBVSxLQUFWLGtCQUFVLFFBK2N2QiIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCI7XHJcblxyXG5leHBvcnQgbW9kdWxlIEV4cHJlc3Npb24ge1xyXG4gICAgdmFyIHVuZGVmaW5lZCA9IHZvaWQgMDtcclxuXHJcbiAgICBjbGFzcyBBc3RWaXNpdG9yIHtcclxuICAgICAgICBzdGF0aWMgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXaGVyZShzb3VyY2UsIHByZWRpY2F0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Qoc291cmNlLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgcXVlcnkocGFyYW0sIHNvdXJjZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFF1ZXJ5KHBhcmFtLCBzb3VyY2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGlkZW50KG5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBJZGVudChuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBtZW1iZXIodGFyZ2V0LCBuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWVtYmVyKHRhcmdldCwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAoZnVuLCBhcmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbnN0KHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJU2NvcGUge1xyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpOiBhbnk7XHJcbiAgICAgICAgZXh0ZW5kPyh2YWx1ZSk6IElTY29wZTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU2NvcGUgaW1wbGVtZW50cyBJU2NvcGUge1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhbHVlOiBhbnkgPSB7fSwgcHJpdmF0ZSBwYXJlbnQ/OiBJU2NvcGUpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlLm1hcChmbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFNjb3BlKHZhbHVlLCB0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInZhbHVlIGlzIHVuZGVmaW5lZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0KG5hbWUpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm1vZGlmeWluZyB2YWx1ZSBpcyBub3QgcGVybWl0dGVkLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52YWx1ZVtuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZVtuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlIGluc3RhbmNlb2YgRGF0ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5iaW5kKHRoaXMudmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2NvcGUodmFsdWUsIHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9KU09OKCkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50OiBhbnkgPSB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKDxhbnk+dGhpcykuX2pzb24gPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICg8YW55PnRoaXMpLl9qc29uID0gXCIqcmVjdXJzaXZlKlwiO1xyXG4gICAgICAgICAgICAgICAgKDxhbnk+dGhpcykuX2pzb24gPSAoPGFueT5PYmplY3QpLmFzc2lnbih7fSwgdGhpcy52YWx1ZSwgcGFyZW50LnRvSlNPTiA/IHBhcmVudC50b0pTT04oKSA6IHt9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuICg8YW55PnRoaXMpLl9qc29uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnRvSlNPTigpLCBudWxsLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgRGVmYXVsdFNjb3BlIHtcclxuICAgICAgICBzdGF0aWMgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGF0aWMgZXh0ZW5kKHZhbHVlOiBhbnkpOiBJU2NvcGUge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFNjb3BlKHZhbHVlLCBEZWZhdWx0U2NvcGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSUV4cHIge1xyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSk7XHJcblxyXG4gICAgICAgIGFwcD8oYXJnczogSUV4cHJbXSk6IElFeHByO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBJZGVudCBpbXBsZW1lbnRzIElFeHByIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIiB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJBcmd1bWVudCBuYW1lIGlzIG51bGwgb3IgZW1wdHlcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2NvcGUuZ2V0KHRoaXMubmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHsgcmV0dXJuIHRoaXMubmFtZTsgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IEFwcCB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXBwKHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgTWVtYmVyIGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFyZ2V0OiBJRXhwciwgcHJpdmF0ZSBtZW1iZXI6IHN0cmluZyB8IElFeHByKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy50YXJnZXQuZXhlY3V0ZShzY29wZSkgYXMgSVNjb3BlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFvYmogfHwgIW9iai5nZXQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy50YXJnZXR9IGlzIG51bGxgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5tZW1iZXIgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmouZ2V0KHRoaXMubWVtYmVyIGFzIHN0cmluZyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5tZW1iZXIgYXMgSUV4cHIpLmV4ZWN1dGUob2JqKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYCR7dGhpcy50YXJnZXR9LiR7dGhpcy5tZW1iZXJ9YDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChhcmdzOiBJRXhwcltdKTogQXBwIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBNb2RlbFBhcmFtZXRlciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIG5hbWUpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgTGFtYmRhIGltcGxlbWVudHMgSUV4cHIge1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1vZGVsTmFtZXM6IHN0cmluZ1tdLCBwcml2YXRlIGJvZHk6IElFeHByKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpOiBGdW5jdGlvbiB7XHJcbiAgICAgICAgICAgIHJldHVybiAoLi4ubW9kZWxzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkU2NvcGUgPSBuZXcgU2NvcGUoe30sIHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubW9kZWxOYW1lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gdGhpcy5tb2RlbE5hbWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gbW9kZWxzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbHVlIG9mICR7bn0gaXMgdW5kZWZpbmVkIDo6ICR7dGhpcy50b1N0cmluZygpfWApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjaGlsZFNjb3BlLnNldChuLCB2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ib2R5LmV4ZWN1dGUoY2hpbGRTY29wZSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IEFwcCB7XHJcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCAhPT0gdGhpcy5tb2RlbE5hbWVzLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImFyZ3VtZW50cyBtaXNtYXRjaFwiKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXBwKHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgKGZ1biAke3RoaXMubW9kZWxOYW1lcy5qb2luKFwiIFwiKX0gLT4gJHt0aGlzLmJvZHl9KWA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgbWVtYmVyKG5hbWU6IHN0cmluZyk6IExhbWJkYSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGFtYmRhKFtcIm1cIl0sIG5ldyBNZW1iZXIobmV3IElkZW50KFwibVwiKSwgbmV3IElkZW50KG5hbWUpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBDb25zdCBpbXBsZW1lbnRzIElFeHByIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhbHVlOiBhbnksIHByaXZhdGUgZGlzcGxheT8pIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheSB8fCB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGFyZ3M6IElFeHByW10pOiBBcHAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFwcCh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFBpcGUgaW1wbGVtZW50cyBJRXhwciB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbGVmdDogSUV4cHIsIHByaXZhdGUgcmlnaHQ6IElFeHByKSB7IH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJpZ2h0LmFwcChbdGhpcy5sZWZ0XSkuZXhlY3V0ZShzY29wZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyB0aGlzLmxlZnQgKyBcIiB8PiBcIiArIHRoaXMucmlnaHQgKyBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGFyZ3M6IElFeHByW10pOiBBcHAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVF1ZXJ5IGV4dGVuZHMgSUV4cHIge1xyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSk6IHsgbWFwLCBmaWx0ZXIsIHNvcnQsIGZvckVhY2ggfTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU2VsZWN0IGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcnk6IElRdWVyeSwgcHJpdmF0ZSBzZWxlY3RvcjogSUV4cHIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSA9IERlZmF1bHRTY29wZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5leGVjdXRlKHNjb3BlKS5tYXAocyA9PiB0aGlzLnNlbGVjdG9yLmV4ZWN1dGUocykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnF1ZXJ5fSBzZWxlY3QgJHt0aGlzLnNlbGVjdG9yfWA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IEFwcCB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBXaGVyZSBpbXBsZW1lbnRzIElRdWVyeSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyeTogSVF1ZXJ5LCBwcml2YXRlIHByZWRpY2F0ZTogSUV4cHIpIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpOiBJU2NvcGVbXSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmV4ZWN1dGUoc2NvcGUpLmZpbHRlcihzY29wZSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcmVkaWNhdGUuZXhlY3V0ZShzY29wZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnF1ZXJ5fSB3aGVyZSAke3RoaXMucHJlZGljYXRlfWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBPcmRlckJ5IGltcGxlbWVudHMgSVF1ZXJ5IHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJ5OiBJUXVlcnksIHByaXZhdGUgc2VsZWN0b3I6IElFeHByKSB7IH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKTogSVNjb3BlW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeS5leGVjdXRlKHNjb3BlKS5zb3J0KCh4LCB5KSA9PiB0aGlzLnNlbGVjdG9yLmV4ZWN1dGUoeCkgPiB0aGlzLnNlbGVjdG9yLmV4ZWN1dGUoeSkgPyAxIDogLTEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnF1ZXJ5fSBvcmRlckJ5ICR7dGhpcy5zZWxlY3Rvcn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBHcm91cCBleHRlbmRzIFNjb3BlIHtcclxuICAgICAgICBwdWJsaWMgc2NvcGVzOiBJU2NvcGVbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IElTY29wZSwgcHVibGljIGtleTogYW55LCBwcml2YXRlIGludG86IHN0cmluZykge1xyXG4gICAgICAgICAgICBzdXBlcihwYXJlbnQsIERlZmF1bHRTY29wZSk7XHJcblxyXG4gICAgICAgICAgICBzdXBlci5zZXQoaW50bywgdGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb3VudCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NvcGVzLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEdyb3VwQnkgaW1wbGVtZW50cyBJUXVlcnkge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcnk6IElRdWVyeSwgcHJpdmF0ZSBzZWxlY3RvcjogSUV4cHIsIHByaXZhdGUgaW50bzogc3RyaW5nKSB7IH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKTogSVNjb3BlW10ge1xyXG4gICAgICAgICAgICB2YXIgZ3JvdXBzOiBHcm91cFtdID0gW107XHJcbiAgICAgICAgICAgIHRoaXMucXVlcnkuZXhlY3V0ZShzY29wZSkuZm9yRWFjaChzY29wZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdGhpcy5zZWxlY3Rvci5leGVjdXRlKHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZzogR3JvdXAgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXBzW2ldLmtleSA9PT0ga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcgPSBncm91cHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFnKVxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGcgPSBuZXcgR3JvdXAoc2NvcGUsIGtleSwgdGhpcy5pbnRvKSk7XHJcbiAgICAgICAgICAgICAgICBnLnNjb3Blcy5wdXNoKHNjb3BlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnF1ZXJ5fSBncm91cEJ5ICR7dGhpcy5zZWxlY3Rvcn0gaW50byAke3RoaXMuaW50b31gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgUXVlcnkgaW1wbGVtZW50cyBJUXVlcnkge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaXRlbU5hbWU6IHN0cmluZywgcHJpdmF0ZSBzb3VyY2VFeHByOiBJRXhwcikge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW1OYW1lICE9PSBcInN0cmluZ1wiIHx8IGl0ZW1OYW1lLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaXRlbU5hbWUgaXMgbnVsbFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKTogQXJyYXk8SVNjb3BlPiB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLnNvdXJjZUV4cHIuZXhlY3V0ZShzY29wZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0ge307XHJcbiAgICAgICAgICAgICAgICBjaGlsZFt0aGlzLml0ZW1OYW1lXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuZXh0ZW5kKGNoaWxkKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBmb3IgJHt0aGlzLml0ZW1OYW1lfSBpbiAke3RoaXMuc291cmNlRXhwcn0gZG9gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXBwIGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBmdW46IElFeHByLCBwdWJsaWMgYXJnczogSUV4cHJbXSA9IFtdKSB7IH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKSB7XHJcbiAgICAgICAgICAgIHZhciBhcmdzID0gdGhpcy5hcmdzLm1hcCh4ID0+IHguZXhlY3V0ZShzY29wZSkudmFsdWVPZigpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICg8YW55PnRoaXMuZnVuID09PSBcIitcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF0gKyBhcmdzWzFdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZnVuID0gdGhpcy5mdW4uZXhlY3V0ZShzY29wZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFyZ3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnVuLnRvU3RyaW5nKCkgKyBcIiAoKVwiO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mdW4udG9TdHJpbmcoKSArIFwiIFwiICsgdGhpcy5hcmdzLm1hcCh4ID0+IHgudG9TdHJpbmcoKSkuam9pbihcIiBcIikgKyBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGFyZ3M6IElFeHByW10pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAodGhpcy5mdW4sIHRoaXMuYXJncy5jb25jYXQoYXJncykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVW5hcnkgaW1wbGVtZW50cyBJRXhwciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBmdW46IElFeHByLCBwcml2YXRlIGFyZ3M6IElFeHByW10pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSA9IERlZmF1bHRTY29wZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gKGFyZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLmFyZ3MubWFwKHggPT4geC5leGVjdXRlKHNjb3BlKSk7XHJcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZnVuID0gdGhpcy5mdW4uZXhlY3V0ZShzY29wZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseShudWxsLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGFyZ3M6IElFeHByW10pOiBJRXhwciB7XHJcbiAgICAgICAgICAgIGlmICghIWFyZ3MgfHwgYXJncy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQXBwKHRoaXMuZnVuLCB0aGlzLmFyZ3MuY29uY2F0KGFyZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvbyBtYW55IGFyZ3VtZW50c1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEJpbmFyeSBpbXBsZW1lbnRzIElFeHByIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGZ1bjogSUV4cHIsIHByaXZhdGUgYXJnczogSUV4cHJbXSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoeCwgeSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLmFyZ3MubWFwKHggPT4geC5leGVjdXRlKHNjb3BlKSk7XHJcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goeCwgeSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZ1biA9IHRoaXMuZnVuLmV4ZWN1dGUoc2NvcGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseShudWxsLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGFwcChhcmdzOiBJRXhwcltdKTogSUV4cHIge1xyXG4gICAgICAgICAgICBpZiAoISFhcmdzIHx8IGFyZ3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVuYXJ5KHRoaXMuZnVuLCB0aGlzLmFyZ3MuY29uY2F0KGFyZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMilcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQXBwKHRoaXMuZnVuLCB0aGlzLmFyZ3MuY29uY2F0KGFyZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvbyBtYW55IGFyZ3VtZW50c1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIE5vdCBpbXBsZW1lbnRzIElFeHByIHtcclxuICAgICAgICBzdGF0aWMgaW52ZXJzZSh4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAheDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcjogSUV4cHIpIHtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpOiBib29sZWFuIHwgRnVuY3Rpb24ge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmV4cHIuZXhlY3V0ZShzY29wZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmogPT4gIXZhbHVlKG9iaik7XHJcbiAgICAgICAgICAgIHJldHVybiAhdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiKG5vdCBcIiArIHRoaXMuZXhwci50b1N0cmluZygpICsgXCIpXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IEFwcCB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbn0iXX0=