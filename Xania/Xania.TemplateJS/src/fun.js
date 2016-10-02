var Xania;
(function (Xania) {
    var Ast;
    (function (Ast) {
        var Const = (function () {
            function Const(value) {
                this.value = value;
            }
            Const.prototype.execute = function (context) {
                return this.value;
            };
            Const.prototype.app = function (args) {
                return new App(new Const(this.value), args);
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
            Ident.prototype.execute = function (context) {
                return !!context.get ? context.get(this.id) : context[this.id];
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
            Member.prototype.execute = function (context) {
                var obj = this.targetExpr.execute(context);
                var member = !!obj.get ? obj.get(this.name) : obj[this.name];
                if (typeof member === "function")
                    return member.bind(obj);
                return member;
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
            App.prototype.execute = function (context) {
                var args = this.args.map(function (x) { return x.execute(context); });
                var target = this.targetExpr.execute(context);
                if (!target)
                    throw new Error(this.targetExpr.toString() + " is undefined or null.");
                if (typeof target.execute === "function")
                    return target.execute.apply(target, args);
                else if (typeof target.apply === "function")
                    return target.apply(this, args);
                throw new Error(this.targetExpr.toString() + " is not a function");
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
            Unit.prototype.execute = function (context) {
                return undefined;
            };
            Unit.prototype.app = function () { throw new Error("app on unit is not supported"); };
            Unit.prototype.toString = function () {
                return "unit";
            };
            Unit.instance = new Unit();
            return Unit;
        }());
        var Not = (function () {
            function Not(expr) {
                this.expr = expr;
            }
            Not.prototype.execute = function (context) {
                return !this.expr.execute(context);
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
            BinaryOperator.equals = function (x, y) {
                return (!!x ? x.valueOf() : x) === (!!y ? y.valueOf() : y);
            };
            BinaryOperator.add = function (x, y) { return x + y; };
            BinaryOperator.substract = function (x, y) { return x - y; };
            BinaryOperator.pipe = function (x, y) { return x(y); };
            return BinaryOperator;
        }());
        var Selector = (function () {
            function Selector(expr) {
                this.expr = expr;
            }
            Selector.prototype.execute = function (context) {
                var list = this.query.execute(context);
                var selector = this.expr;
                return {
                    length: list.length,
                    itemAt: function (idx) {
                        var ctx = list.itemAt(idx);
                        var result = selector.execute(ctx);
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
            Query.prototype.merge = function (context, x) {
                if (!!context.extend) {
                    return context.extend(this.varName, x);
                }
                else {
                    var item = {};
                    item[this.varName] = x;
                    return item;
                }
            };
            Query.prototype.execute = function (context) {
                var _this = this;
                var result = this.sourceExpr.execute(context);
                var length = result.length;
                if (typeof result.length === "number") {
                    var query = this;
                    return {
                        length: length,
                        itemAt: function (idx) {
                            return query.merge(context, !!result.itemAt ? result.itemAt(idx) : result[idx]);
                        },
                        map: function (fn) {
                            var result = [];
                            this.forEach(function (item) {
                                result.push(fn(item));
                            });
                            return result;
                        },
                        forEach: function (fn) {
                            var l = length;
                            for (var idx = 0; idx < l; idx++) {
                                fn(query.merge(context, !!result.itemAt ? result.itemAt(idx) : result[idx]), idx);
                            }
                        }
                    };
                }
                else
                    return result.map(function (x) { return _this.merge(context, x); });
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
            Template.prototype.execute = function (context) {
                if (this.parts.length === 0)
                    return "";
                if (this.parts.length === 1)
                    return this.executePart(context, this.parts[0]);
                var result = "";
                for (var i = 0; i < this.parts.length; i++) {
                    result += this.executePart(context, this.parts[i]);
                }
                return result;
            };
            Template.prototype.executePart = function (context, part) {
                if (typeof part === "string")
                    return part;
                else {
                    var result = part.execute(context);
                    if (!!result && typeof result.call === "function")
                        return result.call(context);
                    return result;
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
            UnaryOperator.prototype.execute = function (context) { };
            UnaryOperator.prototype.app = function (args) {
                throw new Error("Not implemented");
            };
            return UnaryOperator;
        }());
        var Compiler = (function () {
            function Compiler() {
                this.patterns = {
                    string1: /^"(?:(?:\\\n|\\"|[^"\n]))*?"/g,
                    string2: /^'(?:(?:\\\n|\\'|[^'\n]))*?'/g,
                    whitespace: /^\s+/g,
                    ident: /^[a-zA-Z_\$][a-zA-Z_\$0-9]*\b/g,
                    number: /^\d+(?:\.\d+)?(?:e[+-]?\d+)?/g,
                    boolean: /^(?:true|false)/g,
                    lparen: /^\s*\(\s*/g,
                    rparen: /^\s*\)\s*/g,
                    lbrack: /^\s*\[\s*/g,
                    rbrack: /^\s*\]\s*/g,
                    navigate: /^\s*\.\s*/g,
                    operator: /^[\|>=\+\-]+/g,
                    compose: /^compose\b/g,
                    eq: /^\s*=\s*/g
                };
            }
            Compiler.prototype.parsePattern = function (type, stream) {
                if (!this.patterns.hasOwnProperty(type))
                    throw new Error("pattern '" + type + "' is not defined");
                var regex = this.patterns[type];
                return this.parseRegex(regex, stream);
            };
            Compiler.prototype.parseRegex = function (regex, stream) {
                if (!stream.available())
                    return null;
                regex.lastIndex = 0;
                var m = regex.exec(stream.expr);
                if (m !== null) {
                    var token = m[0];
                    stream.consume(token.length);
                    return token;
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
                    this.parseRegex(/^(?:true|false|null)/g, stream);
                if (!token)
                    return null;
                return new Const(eval(token));
            };
            Compiler.prototype.parseBoolean = function (stream) {
                var token = this.parseRegex(/^(?:true|false)/g, stream);
                if (!token)
                    return null;
                return new Const(token === "true");
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
            Compiler.prototype.parseExpr = function (stream) {
                this.ws(stream);
                var expr = this.parseConst(stream) ||
                    this.parseParens(stream) ||
                    this.parseQuery(stream) ||
                    this.parseIdent(stream);
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
                return new Template(parts);
            };
            return Compiler;
        }());
        Ast.Compiler = Compiler;
    })(Ast = Xania.Ast || (Xania.Ast = {}));
})(Xania || (Xania = {}));
var Xania;
(function (Xania) {
    var Fun;
    (function (Fun) {
        var List = (function () {
            function List() {
            }
            List.count = function (fn, list) {
                if (!list)
                    return 0;
                if (!!list.count)
                    return list.count(fn);
                var result = 0;
                for (var i = 0; i < list.length; i++)
                    if (fn(list[i]))
                        result++;
                return result;
            };
            List.any = function (fn, list) {
                return List.count(fn, list) > 0;
            };
            List.all = function (fn, list) {
                return List.count(fn, list) === list.length;
            };
            List.filter = function (fn, list) {
                if (!list)
                    return [];
                return list.filter(fn);
            };
            List.map = function (fn, list) {
                if (!list)
                    return [];
                return list.map(fn);
            };
            List.empty = function (list) {
                return !list || list.length === 0;
            };
            List.reduce = function (fn, initialValue, list) {
                return !list && list.reduce(fn, initialValue);
            };
            return List;
        }());
        Fun.List = List;
    })(Fun = Xania.Fun || (Xania.Fun = {}));
})(Xania || (Xania = {}));
//# sourceMappingURL=fun.js.map