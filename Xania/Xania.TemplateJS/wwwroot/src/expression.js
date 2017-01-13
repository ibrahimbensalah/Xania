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
            return Object.assign({}, this.value, parent.toJSON ? parent.toJSON() : {});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHByZXNzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLElBQWMsVUFBVSxDQXljdkI7QUF6Y0QsV0FBYyxVQUFVO0lBQ3BCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBRXZCO1FBQUE7UUE0QkEsQ0FBQztRQTNCVSxnQkFBSyxHQUFaLFVBQWEsTUFBTSxFQUFFLFNBQVM7WUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU0saUJBQU0sR0FBYixVQUFjLE1BQU0sRUFBRSxRQUFRO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVNLGdCQUFLLEdBQVosVUFBYSxLQUFLLEVBQUUsTUFBTTtZQUN0QixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTSxnQkFBSyxHQUFaLFVBQWEsSUFBSTtZQUNiLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRU0saUJBQU0sR0FBYixVQUFjLE1BQU0sRUFBRSxJQUFJO1lBQ3RCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLGNBQUcsR0FBVixVQUFXLEdBQUcsRUFBRSxJQUFXO1lBQ3ZCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVNLGdCQUFLLEdBQVosVUFBYSxLQUFLO1lBQ2QsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFDTCxp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SUFBSSxPQUFBLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFYLENBQVcsQ0FBQztZQUM5QixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDbEIsQ0FBQztRQUVELHNCQUFRLEdBQVI7WUFDSSxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDO1FBQ2hELENBQUM7UUFFRCxpQkFBRyxHQUFILFVBQUksSUFBYTtZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNMLFVBQUM7SUFBRCxDQUFDLEFBdkJELElBdUJDO0lBdkJZLGNBQUcsTUF1QmYsQ0FBQTtBQUdMLENBQUMsRUF6Y2EsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUF5Y3ZCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuL2NvcmVcIjtcclxuXHJcbmV4cG9ydCBtb2R1bGUgRXhwcmVzc2lvbiB7XHJcbiAgICB2YXIgdW5kZWZpbmVkID0gdm9pZCAwO1xyXG5cclxuICAgIGNsYXNzIEFzdFZpc2l0b3Ige1xyXG4gICAgICAgIHN0YXRpYyB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdoZXJlKHNvdXJjZSwgcHJlZGljYXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFNlbGVjdChzb3VyY2UsIHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUXVlcnkocGFyYW0sIHNvdXJjZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgaWRlbnQobmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IElkZW50KG5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIG1lbWJlcih0YXJnZXQsIG5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNZW1iZXIodGFyZ2V0LCBuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFwcChmdW4sIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29uc3QodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElTY29wZSB7XHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IGFueTtcclxuICAgICAgICBleHRlbmQ/KHZhbHVlKTogSVNjb3BlO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTY29wZSBpbXBsZW1lbnRzIElTY29wZSB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmFsdWU6IGFueSA9IHt9LCBwcml2YXRlIHBhcmVudD86IElTY29wZSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAoZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUubWFwKGZuKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZCh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU2NvcGUodmFsdWUsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidmFsdWUgaXMgdW5kZWZpbmVkXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5nZXQobmFtZSkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibW9kaWZ5aW5nIHZhbHVlIGlzIG5vdCBwZXJtaXR0ZWQuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlW25hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgaW5zdGFuY2VvZiBEYXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmJpbmQodGhpcy52YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTY29wZSh2YWx1ZSwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b0pTT04oKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQ6IGFueSA9IHRoaXMucGFyZW50O1xyXG4gICAgICAgICAgICByZXR1cm4gKDxhbnk+T2JqZWN0KS5hc3NpZ24oe30sIHRoaXMudmFsdWUsIHBhcmVudC50b0pTT04gPyBwYXJlbnQudG9KU09OKCkgOiB7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9KU09OKCksIG51bGwsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBEZWZhdWx0U2NvcGUge1xyXG4gICAgICAgIHN0YXRpYyBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXRpYyBleHRlbmQodmFsdWU6IGFueSk6IElTY29wZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU2NvcGUodmFsdWUsIERlZmF1bHRTY29wZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRXhwciB7XHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlKTtcclxuXHJcbiAgICAgICAgYXBwPyhhcmdzOiBJRXhwcltdKTogSUV4cHI7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIElkZW50IGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiIHx8IG5hbWUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkFyZ3VtZW50IG5hbWUgaXMgbnVsbCBvciBlbXB0eVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZS5nZXQodGhpcy5uYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkgeyByZXR1cm4gdGhpcy5uYW1lOyB9XHJcblxyXG4gICAgICAgIGFwcChhcmdzOiBJRXhwcltdKTogQXBwIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBNZW1iZXIgaW1wbGVtZW50cyBJRXhwciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YXJnZXQ6IElFeHByLCBwcml2YXRlIG1lbWJlcjogc3RyaW5nIHwgSUV4cHIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSA9IERlZmF1bHRTY29wZSkge1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLnRhcmdldC5leGVjdXRlKHNjb3BlKSBhcyBJU2NvcGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW9iaiB8fCAhb2JqLmdldClcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLnRhcmdldH0gaXMgbnVsbGApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1lbWJlciA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iai5nZXQodGhpcy5tZW1iZXIgYXMgc3RyaW5nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLm1lbWJlciBhcyBJRXhwcikuZXhlY3V0ZShvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLnRhcmdldH0uJHt0aGlzLm1lbWJlcn1gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGFyZ3M6IElFeHByW10pOiBBcHAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFwcCh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIE1vZGVsUGFyYW1ldGVyIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBMYW1iZGEgaW1wbGVtZW50cyBJRXhwciB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbW9kZWxOYW1lczogc3RyaW5nW10sIHByaXZhdGUgYm9keTogSUV4cHIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSA9IERlZmF1bHRTY29wZSk6IEZ1bmN0aW9uIHtcclxuICAgICAgICAgICAgcmV0dXJuICguLi5tb2RlbHMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRTY29wZSA9IG5ldyBTY29wZSh7fSwgc2NvcGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tb2RlbE5hbWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSB0aGlzLm1vZGVsTmFtZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBtb2RlbHNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsdWUgb2YgJHtufSBpcyB1bmRlZmluZWQgOjogJHt0aGlzLnRvU3RyaW5nKCl9YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkU2NvcGUuc2V0KG4sIHYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJvZHkuZXhlY3V0ZShjaGlsZFNjb3BlKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChhcmdzOiBJRXhwcltdKTogQXBwIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoICE9PSB0aGlzLm1vZGVsTmFtZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXJndW1lbnRzIG1pc21hdGNoXCIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGAoZnVuICR7dGhpcy5tb2RlbE5hbWVzLmpvaW4oXCIgXCIpfSAtPiAke3RoaXMuYm9keX0pYDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBtZW1iZXIobmFtZTogc3RyaW5nKTogTGFtYmRhIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBMYW1iZGEoW1wibVwiXSwgbmV3IE1lbWJlcihuZXcgSWRlbnQoXCJtXCIpLCBuZXcgSWRlbnQobmFtZSkpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENvbnN0IGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmFsdWU6IGFueSwgcHJpdmF0ZSBkaXNwbGF5PykgeyB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5IHx8IHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IEFwcCB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXBwKHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgUGlwZSBpbXBsZW1lbnRzIElFeHByIHtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBsZWZ0OiBJRXhwciwgcHJpdmF0ZSByaWdodDogSUV4cHIpIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmlnaHQuYXBwKFt0aGlzLmxlZnRdKS5leGVjdXRlKHNjb3BlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHRoaXMubGVmdCArIFwiIHw+IFwiICsgdGhpcy5yaWdodCArIFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IEFwcCB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJUXVlcnkgZXh0ZW5kcyBJRXhwciB7XHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlKTogeyBtYXAsIGZpbHRlciwgc29ydCwgZm9yRWFjaCB9O1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTZWxlY3QgaW1wbGVtZW50cyBJRXhwciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyeTogSVF1ZXJ5LCBwcml2YXRlIHNlbGVjdG9yOiBJRXhwcikge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmV4ZWN1dGUoc2NvcGUpLm1hcChzID0+IHRoaXMuc2VsZWN0b3IuZXhlY3V0ZShzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMucXVlcnl9IHNlbGVjdCAke3RoaXMuc2VsZWN0b3J9YDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChhcmdzOiBJRXhwcltdKTogQXBwIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFdoZXJlIGltcGxlbWVudHMgSVF1ZXJ5IHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJ5OiBJUXVlcnksIHByaXZhdGUgcHJlZGljYXRlOiBJRXhwcikgeyB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSA9IERlZmF1bHRTY29wZSk6IElTY29wZVtdIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnkuZXhlY3V0ZShzY29wZSkuZmlsdGVyKHNjb3BlID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByZWRpY2F0ZS5leGVjdXRlKHNjb3BlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMucXVlcnl9IHdoZXJlICR7dGhpcy5wcmVkaWNhdGV9YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIE9yZGVyQnkgaW1wbGVtZW50cyBJUXVlcnkge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcnk6IElRdWVyeSwgcHJpdmF0ZSBzZWxlY3RvcjogSUV4cHIpIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpOiBJU2NvcGVbXSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5LmV4ZWN1dGUoc2NvcGUpLnNvcnQoKHgsIHkpID0+IHRoaXMuc2VsZWN0b3IuZXhlY3V0ZSh4KSA+IHRoaXMuc2VsZWN0b3IuZXhlY3V0ZSh5KSA/IDEgOiAtMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMucXVlcnl9IG9yZGVyQnkgJHt0aGlzLnNlbGVjdG9yfWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIEdyb3VwIGV4dGVuZHMgU2NvcGUge1xyXG4gICAgICAgIHB1YmxpYyBzY29wZXM6IElTY29wZVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHBhcmVudDogSVNjb3BlLCBwdWJsaWMga2V5OiBhbnksIHByaXZhdGUgaW50bzogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKHBhcmVudCwgRGVmYXVsdFNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgIHN1cGVyLnNldChpbnRvLCB0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvdW50KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zY29wZXMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgR3JvdXBCeSBpbXBsZW1lbnRzIElRdWVyeSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyeTogSVF1ZXJ5LCBwcml2YXRlIHNlbGVjdG9yOiBJRXhwciwgcHJpdmF0ZSBpbnRvOiBzdHJpbmcpIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpOiBJU2NvcGVbXSB7XHJcbiAgICAgICAgICAgIHZhciBncm91cHM6IEdyb3VwW10gPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5xdWVyeS5leGVjdXRlKHNjb3BlKS5mb3JFYWNoKHNjb3BlID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB0aGlzLnNlbGVjdG9yLmV4ZWN1dGUoc2NvcGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBnOiBHcm91cCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChncm91cHNbaV0ua2V5ID09PSBrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWcpXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2goZyA9IG5ldyBHcm91cChzY29wZSwga2V5LCB0aGlzLmludG8pKTtcclxuICAgICAgICAgICAgICAgIGcuc2NvcGVzLnB1c2goc2NvcGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBncm91cHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMucXVlcnl9IGdyb3VwQnkgJHt0aGlzLnNlbGVjdG9yfSBpbnRvICR7dGhpcy5pbnRvfWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBRdWVyeSBpbXBsZW1lbnRzIElRdWVyeSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBpdGVtTmFtZTogc3RyaW5nLCBwcml2YXRlIHNvdXJjZUV4cHI6IElFeHByKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbU5hbWUgIT09IFwic3RyaW5nXCIgfHwgaXRlbU5hbWUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpdGVtTmFtZSBpcyBudWxsXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpOiBBcnJheTxJU2NvcGU+IHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuc291cmNlRXhwci5leGVjdXRlKHNjb3BlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSB7fTtcclxuICAgICAgICAgICAgICAgIGNoaWxkW3RoaXMuaXRlbU5hbWVdID0gaXRlbTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5leHRlbmQoY2hpbGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYGZvciAke3RoaXMuaXRlbU5hbWV9IGluICR7dGhpcy5zb3VyY2VFeHByfSBkb2A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBcHAgaW1wbGVtZW50cyBJRXhwciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIGZ1bjogSUV4cHIsIHB1YmxpYyBhcmdzOiBJRXhwcltdID0gW10pIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpIHtcclxuICAgICAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLmFyZ3MubWFwKHggPT4geC5leGVjdXRlKHNjb3BlKS52YWx1ZU9mKCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKDxhbnk+dGhpcy5mdW4gPT09IFwiK1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1swXSArIGFyZ3NbMV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmdW4gPSB0aGlzLmZ1bi5leGVjdXRlKHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYXJncy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mdW4udG9TdHJpbmcoKSArIFwiICgpXCI7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZ1bi50b1N0cmluZygpICsgXCIgXCIgKyB0aGlzLmFyZ3MubWFwKHggPT4geC50b1N0cmluZygpKS5qb2luKFwiIFwiKSArIFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFwcCh0aGlzLmZ1biwgdGhpcy5hcmdzLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBVbmFyeSBpbXBsZW1lbnRzIElFeHByIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGZ1bjogSUV4cHIsIHByaXZhdGUgYXJnczogSUV4cHJbXSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZShzY29wZTogSVNjb3BlID0gRGVmYXVsdFNjb3BlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoYXJnKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IHRoaXMuYXJncy5tYXAoeCA9PiB4LmV4ZWN1dGUoc2NvcGUpKTtcclxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmcpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmdW4gPSB0aGlzLmZ1bi5leGVjdXRlKHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoYXJnczogSUV4cHJbXSk6IElFeHByIHtcclxuICAgICAgICAgICAgaWYgKCEhYXJncyB8fCBhcmdzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAodGhpcy5mdW4sIHRoaXMuYXJncy5jb25jYXQoYXJncykpO1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vIG1hbnkgYXJndW1lbnRzXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQmluYXJ5IGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZnVuOiBJRXhwciwgcHJpdmF0ZSBhcmdzOiBJRXhwcltdKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleGVjdXRlKHNjb3BlOiBJU2NvcGUgPSBEZWZhdWx0U2NvcGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuICh4LCB5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IHRoaXMuYXJncy5tYXAoeCA9PiB4LmV4ZWN1dGUoc2NvcGUpKTtcclxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh4LCB5KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZnVuID0gdGhpcy5mdW4uZXhlY3V0ZShzY29wZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgYXBwKGFyZ3M6IElFeHByW10pOiBJRXhwciB7XHJcbiAgICAgICAgICAgIGlmICghIWFyZ3MgfHwgYXJncy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVW5hcnkodGhpcy5mdW4sIHRoaXMuYXJncy5jb25jYXQoYXJncykpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBcHAodGhpcy5mdW4sIHRoaXMuYXJncy5jb25jYXQoYXJncykpO1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vIG1hbnkgYXJndW1lbnRzXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgTm90IGltcGxlbWVudHMgSUV4cHIge1xyXG4gICAgICAgIHN0YXRpYyBpbnZlcnNlKHgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICF4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByOiBJRXhwcikge1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoc2NvcGU6IElTY29wZSA9IERlZmF1bHRTY29wZSk6IGJvb2xlYW4gfCBGdW5jdGlvbiB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuZXhwci5leGVjdXRlKHNjb3BlKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iaiA9PiAhdmFsdWUob2JqKTtcclxuICAgICAgICAgICAgcmV0dXJuICF2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCIobm90IFwiICsgdGhpcy5leHByLnRvU3RyaW5nKCkgKyBcIilcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChhcmdzOiBJRXhwcltdKTogQXBwIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==