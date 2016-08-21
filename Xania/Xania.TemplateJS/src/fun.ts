class TemplateEngine {
    private static cacheFn: any = {};

    static compile(input) {
        if (!input || !input.trim()) {
            return null;
        }

        var template = input.replace(/\n/g, "\\\n");
        var decl = [];
        var returnExpr = template.replace(/@([\w\(\)\.,=!']+)/gim, (a, b) => {
            var paramIdx = `arg${decl.length}`;
            decl.push(b);
            return `"+${paramIdx}+"`;
        });

        if (returnExpr === '"+arg0+"') {
            if (!TemplateEngine.cacheFn[input]) {
                const functionBody = `with(m) {return ${decl[0]};}`;
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        } else if (decl.length > 0) {
            var params = decl.map((v, i) => `var arg${i} = ${v}`).join(";");
            if (!TemplateEngine.cacheFn[input]) {
                const functionBody = `with(m) {${params};return "${returnExpr}"}`;
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return () => returnExpr;
    }
}

module Ast {
    interface IExpr {
        execute(...args: any[]);
        app(args: IExpr[]): App;
    }
    class Const implements IExpr {
        constructor(public value: any) { }
        execute() {
            return this.value;
        }
        app(): App {throw new Error("app on const is not supported");}
    }

    class Ident implements IExpr {
        constructor(public id: string) { }

        execute(context) {
            return context[this.id];
        }
        app(args: IExpr[]): App {
            return new App(this, args);
        }
    }

    class Member implements IExpr {
        constructor(public targetExpr: IExpr, public memberExpr: string) {
        }

        execute(context) {
            const obj = this.targetExpr.execute(context);
            var member = obj[this.memberExpr];

            if (typeof member === "function")
                return member.bind(obj);

            return member;
        }
        toString() {
            return `${this.targetExpr}.${this.memberExpr}`;
        }
        app(args: IExpr[]): App {
            return new App(this, args);
        }
    }

    class App implements IExpr {
        constructor(public targetExpr: IExpr, public args: IExpr[]) {
        }

        execute(context, addArgs: any[]) {
            const args = this.args.map(x => x.execute(context)).concat(addArgs);
            const target = this.targetExpr.execute(context);
            if (typeof target !== "function")
                throw new Error(`${this.targetExpr.toString() } is not a function`);
            return target.apply(this, args);
        }
        app(args: IExpr[]): App {
            return new App(this.targetExpr, this.args.concat(args));
        }
    }

    class Unit implements IExpr {
        execute(context) {
            return undefined;
        }
        static instance = new Unit();
        app(): App { throw new Error("app on unit is not supported"); }
    }

    class Query implements IExpr {
        constructor(public varName: string, public sourceExpr: IExpr, public selectorExpr: IExpr) { }
        execute(context) {
            var collection = this.sourceExpr.execute(context).map(x => {
                var item = {};
                item[this.varName] = x;
                var result = this.assign({}, context, item);

                if (this.selectorExpr != null)
                    return this.selectorExpr.execute(result);

                return result;
            });
            return collection;
        }
        app(): App { throw new Error("app on query is not supported"); }

        // static assign = (<any>Object).assign;
        assign(target, ...args) {
            for (var i = 0; i < args.length; i++) {
                const object = args[i];
                for (let prop in object) {
                    if (object.hasOwnProperty(prop)) {
                        target[prop] = object[prop];
                    }
                }
            }
            return target;
        }
    }

    class Template {
        constructor(private parts) {

        }

        execute(context) {
            if (this.parts.length === 0)
                return null;

            if (this.parts.length === 1)
                return this.executePart(context, this.parts[0]);

            let result = "";
            for (var i = 0; i < this.parts.length; i++) {
                result += this.executePart(context, this.parts[i]);
            }
            return result;
        }

        executePart(context, part) {
            if (typeof part === "string")
                return part;
            else
                return part.execute(context);
        }
    }

    export class Compiler {
        public patterns = {
            string1: /^"(?:(?:\\\n|\\"|[^"\n]))*?"/g
            , string2: /^'(?:(?:\\\n|\\'|[^'\n]))*?'/g
        //, comment1: /\/\*[\s\S]*?\*\//
        //, comment2: /\/\/.*?\n/
            , whitespace: /^\s+/g
        // , keyword: /\b(?:var|let|for|if|else|in|class|function|return|with|case|break|switch|export|new|while|do|throw|catch)\b/
        // , regexp: /^\/(?:(?:\\\/|[^\n\/]))*?\//g
            , ident: /^[a-zA-Z_\$][a-zA-Z_\$0-9]*\b/g
            , number: /^\d+(?:\.\d+)?(?:e[+-]?\d+)?/g
        // , parens: /^[\(\)]/g
            , lparen: /^\s*\(\s*/g
            , rparen: /^\s*\)\s*/g
            , lbrack: /^\s*\[\s*/g
            , rbrack: /^\s*\]\s*/g
        //, curly: /^[{}]/g
        //, square: /^[\[\]]/g
            , navigate: /^\s*\.\s*/g
        // , punct: /^[;.:\?\^%<>=!&|+\-,~]/g
            , pipe1: /^\|>/g
            , pipe2: /^\|\|>/g
            , select: /^->/g
        };

        parsePattern(type, stream): string {
            if (!this.patterns.hasOwnProperty(type))
                throw new Error(`pattern '${type}' is not defined`);

            const regex: RegExp = this.patterns[type];

            return this.parseRegex(regex, stream);
        }

        parseRegex(regex, stream): string {
            if (!stream.available())
                return null;
            regex.lastIndex = 0;
            const m = regex.exec(stream.expr);
            if (m !== null) {
                var token = m[0];
                stream.consume(token.length);
                return token;
            }

            return null;
        }

        skipWhitespaces(stream): boolean {
            return !!this.parsePattern("whitespace", stream);
        }

        parseConst(stream): IExpr {
            var token = this.parsePattern("string1", stream) ||
                this.parsePattern("string2", stream) ||
                this.parsePattern("number", stream);

            if (!token)
                return null;

            return new Const(eval(token));
        }

        parseIdent(stream): IExpr {
            const token = this.parsePattern("ident", stream);
            if (!token)
                return null;

            var ident: IExpr = new Ident(token);

            this.skipWhitespaces(stream);
            while (this.parsePattern("navigate", stream)) {
                this.skipWhitespaces(stream);
                const member = this.parsePattern("ident", stream);
                // const member = this.parseMember(stream);

                if (!!member)
                    ident = new Member(ident, member);
                else
                    throw new SyntaxError(`Expected identifier at ${stream}`);
            }

            var args = this.parseArgs(stream);
            if (args !== null) {
                return ident.app(args);
            }

            return ident;
        }

        parseParens(stream): IExpr {
            if (this.parsePattern("lparen", stream)) {
                this.skipWhitespaces(stream);
                const arg = this.parseExpr(stream);

                this.skipWhitespaces(stream);
                if (!this.parsePattern("rparen", stream))
                    throw new SyntaxError(`expected ')' at: '${stream}'`);
                return arg || Unit.instance;
            }
            return null;
        }

        parseQuery(stream): IExpr {
            if (this.parseRegex(/^for\b/g, stream) !== null) {
                this.skipWhitespaces(stream);
                const varName = this.parsePattern("ident", stream);
                if (varName === null)
                    throw new SyntaxError(`expected variable at: ${stream}`);

                if (this.parseRegex(/^\s*in\b/g, stream) === null)
                    throw new SyntaxError(`expected 'in' keyword at: '${stream}'`);

                this.skipWhitespaces(stream);
                var sourceExpr = this.parseExpr(stream);

                var selectorExpr = null;
                this.skipWhitespaces(stream);
                if (this.parsePattern("select", stream)) {
                    this.skipWhitespaces(stream);
                    selectorExpr = this.parseExpr(stream);
                    if (selectorExpr === null)
                        throw new SyntaxError(`expected select expression at: '${stream}'`);
                }
                return new Query(varName, sourceExpr, selectorExpr);
            }
            return null;
        }

        parseArgs(stream): IExpr[] {
            const args = [];
            let arg;

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
        }

        parseExpr(stream): any {
            this.skipWhitespaces(stream);

            const expr =
                this.parseConst(stream) ||
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
                    throw new SyntaxError(`Expected filter at: ${stream}`);

                return filter.app([ expr ]);
            }

            return expr;
        }

        expr(expr): IExpr {
            var ast = this.parseExpr({
                expr,
                length: expr.length,
                available() {
                    return this.length > 0;
                },
                consume(size) {
                    this.expr = this.expr.substring(size);
                },
                toString() {
                    return this.expr;
                }
            });
            if (!ast)
                throw new SyntaxError("Could not evaluate expression: " + expr.substring(0, 10) + "...");
            return ast;
        }

        template(text) {
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
                    } else {
                        throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
                    }
                } else {
                    parts.push(text.substring(offset));
                    break;
                }
            }

            var tpl = new Template(parts);
            return tpl.execute.bind(tpl);
        }

        regex: RegExp;
    }
}

class Test {
    constructor(public value) {
    }
    get seed() {
        return this.value;
    }
}