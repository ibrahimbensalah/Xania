var TemplateEngine = (function () {
    function TemplateEngine() {
    }
    TemplateEngine.compile = function (input) {
        if (!input || !input.trim()) {
            return null;
        }
        var template = input.replace(/\n/g, "\\\n");
        var decl = [];
        var returnExpr = template.replace(/@([\w\(\)\.,=!']+)/gim, function (a, b) {
            var paramIdx = "arg" + decl.length;
            decl.push(b);
            return "\"+" + paramIdx + "+\"";
        });
        if (returnExpr === '"+arg0+"') {
            if (!TemplateEngine.cacheFn[input]) {
                var functionBody = "with(m) {return " + decl[0] + ";}";
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        else if (decl.length > 0) {
            var params = decl.map(function (v, i) { return ("var arg" + i + " = " + v); }).join(";");
            if (!TemplateEngine.cacheFn[input]) {
                var functionBody = "with(m) {" + params + ";return \"" + returnExpr + "\"}";
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return function () { return returnExpr; };
    };
    TemplateEngine.cacheFn = {};
    return TemplateEngine;
})();
var Ast;
(function (Ast) {
    var Const = (function () {
        function Const(value) {
            this.value = value;
        }
        Const.prototype.execute = function () {
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
            return context[this.id];
        };
        Ident.prototype.app = function (args) {
            return new App(this, args);
        };
        return Ident;
    })();
    var Member = (function () {
        function Member(targetExpr, memberExpr) {
            this.targetExpr = targetExpr;
            this.memberExpr = memberExpr;
        }
        Member.prototype.execute = function (context) {
            var obj = this.targetExpr.execute(context);
            var member = obj[this.memberExpr];
            if (typeof member === "function")
                return member.bind(obj);
            return member;
        };
        Member.prototype.toString = function () {
            return this.targetExpr + "." + this.memberExpr;
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
        App.prototype.execute = function (context, addArgs) {
            var args = this.args.map(function (x) { return x.execute(context); }).concat(addArgs);
            var target = this.targetExpr.execute(context);
            if (typeof target !== "function")
                throw new Error(this.targetExpr.toString() + " is not a function");
            return target.apply(this, args);
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
    var Query = (function () {
        function Query(varName, sourceExpr, selectorExpr) {
            this.varName = varName;
            this.sourceExpr = sourceExpr;
            this.selectorExpr = selectorExpr;
        }
        Query.prototype.execute = function (context) {
            var _this = this;
            var collection = this.sourceExpr.execute(context).map(function (x) {
                var item = {};
                item[_this.varName] = x;
                var result = _this.assign({}, context, item);
                if (_this.selectorExpr != null)
                    return _this.selectorExpr.execute(result);
                return result;
            });
            return collection;
        };
        Query.prototype.app = function () { throw new Error("app on query is not supported"); };
        Query.prototype.assign = function (target) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            for (var i = 0; i < args.length; i++) {
                var object = args[i];
                for (var prop in object) {
                    if (object.hasOwnProperty(prop)) {
                        target[prop] = object[prop];
                    }
                }
            }
            return target;
        };
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
            else
                return part.execute(context);
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
                lparen: /^\s*\(\s*/g,
                rparen: /^\s*\)\s*/g,
                lbrack: /^\s*\[\s*/g,
                rbrack: /^\s*\]\s*/g,
                navigate: /^\s*\.\s*/g,
                pipe1: /^\|>/g,
                pipe2: /^\|\|>/g,
                select: /^->/g
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
        Compiler.prototype.skipWhitespaces = function (stream) {
            return !!this.parsePattern("whitespace", stream);
        };
        Compiler.prototype.parseConst = function (stream) {
            var token = this.parsePattern("string1", stream) ||
                this.parsePattern("string2", stream) ||
                this.parsePattern("number", stream);
            if (!token)
                return null;
            return new Const(eval(token));
        };
        Compiler.prototype.parseIdent = function (stream) {
            var token = this.parsePattern("ident", stream);
            if (!token)
                return null;
            var ident = new Ident(token);
            this.skipWhitespaces(stream);
            while (this.parsePattern("navigate", stream)) {
                this.skipWhitespaces(stream);
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
                this.skipWhitespaces(stream);
                var arg = this.parseExpr(stream);
                this.skipWhitespaces(stream);
                if (!this.parsePattern("rparen", stream))
                    throw new SyntaxError("expected ')' at: '" + stream + "'");
                return arg || Unit.instance;
            }
            return null;
        };
        Compiler.prototype.parseQuery = function (stream) {
            if (this.parseRegex(/^for\b/g, stream) !== null) {
                this.skipWhitespaces(stream);
                var varName = this.parsePattern("ident", stream);
                if (varName === null)
                    throw new SyntaxError("expected variable at: " + stream);
                if (this.parseRegex(/^\s*in\b/g, stream) === null)
                    throw new SyntaxError("expected 'in' keyword at: '" + stream + "'");
                this.skipWhitespaces(stream);
                var sourceExpr = this.parseExpr(stream);
                var selectorExpr = null;
                this.skipWhitespaces(stream);
                if (this.parsePattern("select", stream)) {
                    this.skipWhitespaces(stream);
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
                this.skipWhitespaces(stream);
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
            this.skipWhitespaces(stream);
            var expr = this.parseConst(stream) ||
                this.parseParens(stream) ||
                this.parseQuery(stream) ||
                this.parseIdent(stream);
            if (!expr) {
                return null;
            }
            this.skipWhitespaces(stream);
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
            var offset = 0;
            while (offset < text.length) {
                var begin = text.indexOf("{{", offset);
                if (begin >= 0) {
                    if (begin > offset)
                        parts.push(text.substring(offset, begin));
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
                    parts.push(text.substring(offset));
                    break;
                }
            }
            var tpl = new Template(parts);
            return tpl.execute.bind(tpl);
        };
        return Compiler;
    })();
    Ast.Compiler = Compiler;
})(Ast || (Ast = {}));
var Test = (function () {
    function Test(value) {
        this.value = value;
    }
    Object.defineProperty(Test.prototype, "seed", {
        get: function () {
            return this.value;
        },
        enumerable: true,
        configurable: true
    });
    return Test;
})();
//# sourceMappingURL=fun.js.map