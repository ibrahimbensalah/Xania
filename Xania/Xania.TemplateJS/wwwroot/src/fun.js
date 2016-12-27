var Xania;
(function (Xania) {
    var Ast;
    (function (Ast) {
        var Const = (function () {
            function Const(value) {
                this.value = value;
            }
            Const.prototype.execute = function () {
                return this.value;
            };
            Const.prototype.app = function (args) {
                return new App(this, args);
            };
            Const.prototype.toString = function () {
                return "'" + this.value + "'";
            };
            return Const;
        }());
        var Ident = (function () {
            function Ident(id) {
                this.id = id;
            }
            Ident.prototype.execute = function (context, provider) {
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                return provider.get(context, this.id);
            };
            Ident.prototype.app = function (args) {
                return new App(this, args);
            };
            Ident.prototype.toString = function () {
                return this.id;
            };
            return Ident;
        }());
        var Member = (function () {
            function Member(targetExpr, name) {
                this.targetExpr = targetExpr;
                this.name = name;
            }
            Member.prototype.execute = function (context, provider) {
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                var obj = this.targetExpr.execute(context, provider);
                return provider.get(obj, this.name);
            };
            Member.prototype.app = function (args) {
                return new App(this, args);
            };
            Member.prototype.toString = function () {
                return this.targetExpr + "." + this.name;
            };
            return Member;
        }());
        var App = (function () {
            function App(targetExpr, args) {
                this.targetExpr = targetExpr;
                this.args = args;
            }
            App.prototype.execute = function (context, provider) {
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                var args = this.args.map(function (x) { return x.execute(context, provider); }).filter(function (x) { return x !== undefined; });
                var target = this.targetExpr.execute(context, provider);
                if (target === undefined)
                    throw new Error(this.targetExpr.toString() + " is undefined or null.");
                return provider.invoke(context, target, args);
            };
            App.prototype.app = function (args) {
                return new App(this.targetExpr, this.args.concat(args));
            };
            App.prototype.toString = function () {
                var str = this.targetExpr.toString();
                for (var i = 0; i < this.args.length; i++) {
                    str += " " + this.args[i];
                }
                return "(" + str + ")";
            };
            return App;
        }());
        var Unit = (function () {
            function Unit() {
            }
            Unit.prototype.execute = function () {
                return undefined;
            };
            Unit.prototype.app = function () { throw new Error("app on unit is not supported"); };
            Unit.prototype.toString = function () {
                return "unit";
            };
            return Unit;
        }());
        Unit.instance = new Unit();
        var Not = (function () {
            function Not(expr) {
                this.expr = expr;
            }
            Not.prototype.execute = function (context, provider) {
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                return !this.expr.execute(context, provider);
            };
            Not.prototype.app = function (args) {
                return new Not(this.expr.app(args));
            };
            Not.prototype.toString = function () {
                return "not " + this.expr;
            };
            return Not;
        }());
        var BinaryOperator = (function () {
            function BinaryOperator() {
            }
            return BinaryOperator;
        }());
        BinaryOperator.equals = function (x, y) {
            return (!!x ? x.valueOf() : x) === (!!y ? y.valueOf() : y);
        };
        BinaryOperator.add = function (x, y) { return x + y; };
        BinaryOperator.substract = function (x, y) { return x - y; };
        BinaryOperator.pipe = function (x, y) { return x(y); };
        BinaryOperator.member = function (name) {
            return function (obj) {
                return obj[name];
            };
        };
        var Assign = (function () {
            function Assign(valueExpr, targetExpr) {
                if (targetExpr === void 0) { targetExpr = null; }
                this.valueExpr = valueExpr;
                this.targetExpr = targetExpr;
            }
            Assign.prototype.execute = function (context, provider) {
                var newValue = this.valueExpr.app([this.targetExpr]).execute(context, provider);
                provider.set(context, this.targetExpr.id, newValue);
            };
            Assign.prototype.app = function (args) {
                return new Assign(this.valueExpr, args[0]);
            };
            return Assign;
        }());
        var Selector = (function () {
            function Selector(expr) {
                this.expr = expr;
            }
            Selector.prototype.execute = function (context, provider) {
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                var list = this.query.execute(context, provider);
                var selector = this.expr;
                return {
                    length: list.length,
                    itemAt: function (idx) {
                        var ctx = provider.itemAt(list, idx);
                        var result = selector.execute(ctx, provider);
                        return result;
                    },
                    forEach: function (fn) {
                        var l = length;
                        for (var idx = 0; idx < l; idx++) {
                            fn(this.itemAt(idx), idx);
                        }
                    }
                };
            };
            Selector.prototype.app = function (args) {
                if (!!this.query) {
                    this.query = this.query.app(args);
                }
                else {
                    if (args.length !== 1) {
                        throw new Error("Expect number of arguments to be 1, but found " + args.length);
                    }
                    this.query = args[0];
                }
                return this;
            };
            return Selector;
        }());
        var Query = (function () {
            function Query(varName, sourceExpr) {
                this.varName = varName;
                this.sourceExpr = sourceExpr;
            }
            Query.prototype.execute = function (context, provider) {
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                var result = this.sourceExpr.execute(context, provider);
                return {
                    varName: this.varName,
                    context: context,
                    provider: provider,
                    extend: function (x) {
                        return this.provider.extend(this.context, this.varName, x);
                    },
                    map: function (fn) {
                        var _this = this;
                        return this.provider.map(result, function (x, idx) { return fn(_this.extend(x), idx); });
                    },
                    forEach: function (fn) {
                        var _this = this;
                        return this.provider.forEach(result, function (x, idx) { return fn(_this.extend(x), idx); });
                    }
                };
            };
            Query.prototype.app = function () { throw new Error("app on query is not supported"); };
            Query.prototype.toString = function () {
                return "(for " + this.varName + " in " + this.sourceExpr + ")";
            };
            return Query;
        }());
        var Template = (function () {
            function Template(parts) {
                this.parts = parts;
            }
            Template.prototype.execute = function (context, provider) {
                var _this = this;
                if (provider === void 0) { provider = DefaultRuntimeProvider; }
                if (this.parts.length === 0)
                    return "";
                if (this.parts.length === 1)
                    return this.executePart(this.parts[0], context, provider);
                return this.join(this.parts.map(function (p) { return _this.executePart(p, context, provider); }));
            };
            Template.prototype.join = function (streams) {
                var observer = {
                    values: new Array(streams.length),
                    observers: [],
                    subscribe: function (observer) {
                        this.observers.push(observer);
                        var result = this.valueOf();
                        if (result !== undefined) {
                            observer.onNext(result);
                        }
                    },
                    set: function (idx, value) {
                        if (this.values[idx] !== value) {
                            this.values[idx] = value;
                            this.notify();
                        }
                    },
                    notify: function () {
                        var result = this.valueOf();
                        if (result !== undefined)
                            for (var e = 0; e < this.observers.length; e++) {
                                this.observers[e].onNext(result);
                            }
                    },
                    valueOf: function () {
                        for (var i = 0; i < this.values.length; i++) {
                            if (this.values[i] === undefined)
                                return undefined;
                        }
                        return this.values.join('');
                    }
                };
                for (var i = 0; i < streams.length; i++) {
                    var st = streams[i].valueOf();
                    if (!!st.subscribe) {
                        st.subscribe({
                            idx: i,
                            onNext: function (v) {
                                observer.set(this.idx, v);
                            }
                        });
                    }
                    else {
                        observer.set(i, st);
                    }
                }
                return observer;
            };
            Template.prototype.executePart = function (part, context, provider) {
                if (typeof part === "string")
                    return part;
                else {
                    return part.execute(context, provider);
                }
            };
            Template.prototype.toString = function () {
                var result = "";
                for (var i = 0; i < this.parts.length; i++) {
                    result += this.parts[i];
                }
                return result;
            };
            return Template;
        }());
        var UnaryOperator = (function () {
            function UnaryOperator(handler) {
                this.handler = handler;
            }
            UnaryOperator.prototype.execute = function () { };
            UnaryOperator.prototype.app = function (args) {
                throw new Error("Not implemented");
            };
            return UnaryOperator;
        }());
        var DefaultRuntimeProvider = (function () {
            function DefaultRuntimeProvider() {
            }
            DefaultRuntimeProvider.itemAt = function (arr, idx) {
                return arr[idx];
            };
            DefaultRuntimeProvider.get = function (obj, name) {
                return obj[name];
            };
            DefaultRuntimeProvider.set = function (obj, name, value) {
                throw new Error("Not implemented");
            };
            DefaultRuntimeProvider.extend = function (context, varName, x) {
                var item = {};
                item[varName] = x;
                return Object.assign(item, context);
            };
            DefaultRuntimeProvider.forEach = function (arr, fn) {
                return arr.forEach(fn);
            };
            DefaultRuntimeProvider.map = function (arr, fn) {
                return arr.map(fn);
            };
            DefaultRuntimeProvider.invoke = function (context, invocable, args) {
                return invocable.apply(context, args);
                //if (typeof target.execute === "function")
                //    return provider.invoke(target, args);
                //// return target.execute.apply(target, args);
                //else if (typeof target.apply === "function")
                //    return target.apply(this, args);
                //throw new Error(`${this.targetExpr.toString()} is not a function`);
            };
            return DefaultRuntimeProvider;
        }());
        var Compiler = (function () {
            function Compiler() {
            }
            Compiler.prototype.parsePattern = function (type, stream) {
                if (!Compiler.patterns.hasOwnProperty(type))
                    throw new Error("pattern '" + type + "' is not defined");
                var regex = Compiler.patterns[type];
                var m = this.parseRegex(regex, stream);
                return !!m ? m[0] : m;
            };
            Compiler.prototype.parseRegex = function (regex, stream) {
                if (!stream.available())
                    return null;
                regex.lastIndex = 0;
                var m = regex.exec(stream.expr);
                if (m !== null) {
                    var token = m[0];
                    stream.consume(token.length);
                    return m;
                }
                return null;
            };
            Compiler.prototype.ws = function (stream) {
                return !!this.parsePattern("whitespace", stream);
            };
            Compiler.prototype.parseConst = function (stream) {
                var token = this.parsePattern("string1", stream) ||
                    this.parsePattern("string2", stream) ||
                    this.parsePattern("number", stream) ||
                    this.parsePattern("booleanOrNull", stream);
                if (!token)
                    return null;
                return new Const(eval(token));
            };
            Compiler.prototype.parseBoolean = function (stream) {
                var match = this.parseRegex(/^(?:true|false)/g, stream);
                if (!match)
                    return null;
                return new Const(match[0] === "true");
            };
            Compiler.prototype.parseIdent = function (stream) {
                var token = this.parsePattern("ident", stream);
                if (!token)
                    return null;
                if (token === "not") {
                    this.ws(stream);
                    var expr = this.parseBoolean(stream) || this.parseIdent(stream);
                    if (expr === null)
                        throw new SyntaxError("Expected boolean expression at " + stream);
                    return new Not(expr);
                }
                var ident = new Ident(token);
                this.ws(stream);
                while (this.parsePattern("navigate", stream)) {
                    this.ws(stream);
                    var member = this.parsePattern("ident", stream);
                    // const member = this.parseMember(stream);
                    if (!!member)
                        ident = new Member(ident, member);
                    else
                        throw new SyntaxError("Expected identifier at " + stream);
                }
                return ident;
            };
            Compiler.prototype.parseParens = function (stream) {
                if (this.parsePattern("lparen", stream)) {
                    this.ws(stream);
                    var arg = this.parseExpr(stream);
                    this.ws(stream);
                    if (!this.parsePattern("rparen", stream))
                        throw new SyntaxError("expected ')' at: '" + stream + "'");
                    return arg || Unit.instance;
                }
                return null;
            };
            Compiler.prototype.parseOperator = function (stream) {
                var op = this.parsePattern("operator", stream);
                if (!!op) {
                    switch (op) {
                        case ".":
                            return new Const(BinaryOperator.member)
                                .app([new Const(this.parsePattern("ident", stream))]);
                        case "=":
                            return new Const(BinaryOperator.equals)
                                .app([this.parseExpr(stream)]);
                        case "+":
                            return new Const(BinaryOperator.add)
                                .app([this.parseExpr(stream)]);
                        case "-":
                            return new Const(BinaryOperator.substract)
                                .app([this.parseExpr(stream)]);
                        case "|>":
                            return this.parseExpr(stream);
                        case "->":
                            return new Selector(this.parseExpr(stream));
                        case "<-":
                            return new Assign(this.parseExpr(stream));
                        default:
                            throw new SyntaxError("unresolved operator '" + op + "'");
                    }
                }
                return null;
            };
            Compiler.prototype.parseQuery = function (stream) {
                if (this.parseRegex(/^for\b/g, stream) !== null) {
                    this.ws(stream);
                    var varName = this.parsePattern("ident", stream);
                    if (varName === null)
                        throw new SyntaxError("expected variable at: " + stream);
                    if (this.parseRegex(/^\s*in\b/g, stream) === null)
                        throw new SyntaxError("expected 'in' keyword at: '" + stream + "'");
                    this.ws(stream);
                    var sourceExpr = this.parseExpr(stream);
                    return new Query(varName, sourceExpr);
                }
                return null;
            };
            Compiler.prototype.parseArgs = function (stream) {
                var args = [];
                var arg;
                do {
                    this.ws(stream);
                    arg = this.parseConst(stream) || this.parseIdent(stream) || this.parseParens(stream);
                    if (arg === null)
                        break;
                    args.push(arg);
                } while (true);
                if (args.length > 0)
                    return args;
                return null;
            };
            Compiler.prototype.parseArray = function (stream) {
                if (!this.parsePattern("lbrack", stream)) {
                    return null;
                }
                this.ws(stream);
                var token = this.parseRegex(Compiler.patterns.range, stream);
                if (token === null) {
                    throw new SyntaxError("expected range at: '" + stream + "'");
                }
                this.ws(stream);
                if (!this.parsePattern("rbrack", stream))
                    throw new SyntaxError("expected ')' at: '" + stream + "'");
                var begin = parseInt(token[1]);
                var end = parseInt(token[2]);
                var arr = [];
                for (var i = begin; i <= end; i++) {
                    arr.push(i);
                }
                return new Const(arr);
            };
            Compiler.prototype.parseExpr = function (stream) {
                this.ws(stream);
                var expr = this.parseConst(stream) ||
                    this.parseParens(stream) ||
                    this.parseQuery(stream) ||
                    this.parseIdent(stream) ||
                    this.parseOperator(stream) ||
                    this.parseArray(stream);
                if (!expr) {
                    return null;
                }
                this.ws(stream);
                var operator = this.parseOperator(stream);
                if (!!operator) {
                    expr = operator.app([expr]);
                }
                var args = this.parseArgs(stream);
                if (args !== null) {
                    return expr.app(args);
                }
                return expr;
            };
            Compiler.prototype.expr = function (expr) {
                var ast = this.parseExpr({
                    expr: expr,
                    length: expr.length,
                    available: function () {
                        return this.length > 0;
                    },
                    consume: function (size) {
                        this.expr = this.expr.substring(size);
                    },
                    toString: function () {
                        return this.expr;
                    }
                });
                if (!ast)
                    throw new SyntaxError("Could not evaluate expression: " + expr.substring(0, 10) + "...");
                return ast;
            };
            Compiler.prototype.template = function (text) {
                var parts = [];
                var appendText = function (x) {
                    var s = x.trim();
                    if (s.length > 0)
                        parts.push(x);
                };
                var offset = 0;
                while (offset < text.length) {
                    var begin = text.indexOf("{{", offset);
                    if (begin >= 0) {
                        if (begin > offset)
                            appendText(text.substring(offset, begin));
                        offset = begin + 2;
                        var end = text.indexOf("}}", offset);
                        if (end >= 0) {
                            parts.push(this.expr(text.substring(offset, end)));
                            offset = end + 2;
                        }
                        else {
                            throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
                        }
                    }
                    else {
                        appendText(text.substring(offset));
                        break;
                    }
                }
                //if (parts.length === 1 && typeof parts[0] === "string")
                //    return new Const(parts[0]);
                return new Template(parts);
            };
            return Compiler;
        }());
        Compiler.patterns = {
            string1: /^"(?:(?:\\\n|\\"|[^"\n]))*?"/g,
            string2: /^'(?:(?:\\\n|\\'|[^'\n]))*?'/g,
            whitespace: /^\s+/g,
            ident: /^[a-zA-Z_\$][a-zA-Z_\$0-9]*\b/g,
            number: /^[\+\-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g,
            booleanOrNull: /^(?:true|false|null)/g // /^(?:true|false|null)/g
            ,
            lparen: /^\s*\(\s*/g,
            rparen: /^\s*\)\s*/g,
            lbrack: /^\s*\[\s*/g,
            rbrack: /^\s*\]\s*/g,
            navigate: /^\s*\.\s*/g,
            operator: /^(?:<-|\|>|\=|\.|[\+\-]\B)+/g,
            range: /^(\d+)\s*\.\.\s*(\d+)/g,
            compose: /^compose\b/g,
            eq: /^\s*=\s*/g
        };
        Ast.Compiler = Compiler;
    })(Ast = Xania.Ast || (Xania.Ast = {}));
})(Xania || (Xania = {}));
