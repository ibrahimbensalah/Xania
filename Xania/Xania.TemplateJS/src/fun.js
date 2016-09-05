var Ast;
(function (Ast) {
    var Const = (function () {
        function Const(value) {
            this.value = value;
        }
        Const.prototype.execute = function (context) {
            return this.value;
        };
        Const.prototype.app = function () { throw new Error("app on const is not supported"); };
        return Const;
    })();
    var Ident = (function () {
        function Ident(id) {
            this.id = id;
        }
        Ident.prototype.execute = function (context) {
            return context.prop(this.id);
        };
        Ident.prototype.app = function (args) {
            return new App(this, args);
        };
        return Ident;
    })();
    var Member = (function () {
        function Member(targetExpr, name) {
            this.targetExpr = targetExpr;
            this.name = name;
        }
        Member.prototype.execute = function (context) {
            var obj = this.targetExpr.execute(context);
            var member = obj.prop(this.name);
            if (typeof member === "function")
                return member.bind(obj);
            return member;
        };
        Member.prototype.toString = function () {
            return this.targetExpr + "." + this.name;
        };
        Member.prototype.app = function (args) {
            return new App(this, args);
        };
        return Member;
    })();
    var App = (function () {
        function App(targetExpr, args) {
            this.targetExpr = targetExpr;
            this.args = args;
        }
        App.prototype.execute = function (context) {
            var args = this.args.map(function (x) { return x.execute(context); });
            var target = this.targetExpr.execute(context);
            if (!!target && typeof target.apply === "function")
                return target.apply(this, args);
            throw new Error(this.targetExpr.toString() + " is not a function");
        };
        App.prototype.app = function (args) {
            return new App(this.targetExpr, this.args.concat(args));
        };
        return App;
    })();
    var Unit = (function () {
        function Unit() {
        }
        Unit.prototype.execute = function (context) {
            return undefined;
        };
        Unit.prototype.app = function () { throw new Error("app on unit is not supported"); };
        Unit.instance = new Unit();
        return Unit;
    })();
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
        return Not;
    })();
    var Query = (function () {
        function Query(varName, sourceExpr, selectorExpr) {
            this.varName = varName;
            this.sourceExpr = sourceExpr;
            this.selectorExpr = selectorExpr;
        }
        Query.prototype.merge = function (context, x) {
            var item = {};
            item[this.varName] = x;
            var result = context.extend(item);
            if (this.selectorExpr !== null)
                return this.selectorExpr.execute(result);
            return result;
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
                        return query.merge(context, result.prop(idx));
                    },
                    forEach: function (fn) {
                        var q = query, r = result, l = length;
                        for (var idx = 0; idx < l; idx++) {
                            var merged = q.merge(context, r.prop(idx));
                            fn(merged, idx);
                        }
                    }
                };
            }
            else
                return result.map(function (x) { return _this.merge(context, x); });
        };
        Query.prototype.app = function () { throw new Error("app on query is not supported"); };
        return Query;
    })();
    var Template = (function () {
        function Template(parts) {
            this.parts = parts;
        }
        Template.prototype.execute = function (context) {
            if (this.parts.length === 0)
                return null;
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
                    return result.call(this);
                return result;
            }
        };
        return Template;
    })();
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
                pipe1: /^\|>/g,
                pipe2: /^\|\|>/g,
                select: /^->/g,
                compose: /^compose\b/g
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
            var args = this.parseArgs(stream);
            if (args !== null) {
                return ident.app(args);
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
                var selectorExpr = null;
                this.ws(stream);
                if (this.parsePattern("select", stream)) {
                    this.ws(stream);
                    selectorExpr = this.parseExpr(stream);
                    if (selectorExpr === null)
                        throw new SyntaxError("expected select expression at: '" + stream + "'");
                }
                return new Query(varName, sourceExpr, selectorExpr);
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
            if (!!this.parsePattern("pipe1", stream)) {
                var filter = this.parseExpr(stream);
                if (!filter)
                    throw new SyntaxError("Expected filter at: " + stream);
                return filter.app([expr]);
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
    })();
    Ast.Compiler = Compiler;
})(Ast || (Ast = {}));
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
            debugger;
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
    })();
    Fun.List = List;
})(Fun || (Fun = {}));
