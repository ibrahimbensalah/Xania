module Ast {
    interface IContext {
        prop(name: string);
        extend(object);
    }
    interface IExpr {
        execute(context: IContext);
        app(args: IExpr[]): IExpr;
    }

    class Const implements IExpr {
        constructor(public value: any) { }
        execute(context: IContext) {
            return this.value;
        }
        app(): IExpr { throw new Error("app on const is not supported"); }
    }

    class Ident implements IExpr {
        constructor(public id: string) { }

        execute(context: IContext) {
            return context.prop(this.id);
        }
        app(args: IExpr[]): IExpr {
            return new App(this, args);
        }
    }

    class Member implements IExpr {
        constructor(public targetExpr: IExpr, public name: string) {
        }

        execute(context: IContext) {
            const obj = this.targetExpr.execute(context);
            var member = obj.prop(this.name);

            if (typeof member === "function")
                return member.bind(obj);

            return member;
        }
        toString() {
            return `${this.targetExpr}.${this.name}`;
        }
        app(args: IExpr[]): IExpr {
            return new App(this, args);
        }
    }

    class App implements IExpr {
        constructor(public targetExpr: IExpr, public args: IExpr[]) {
        }

        execute(context: IContext) {
            let args = this.args.map(x => x.execute(context));

            const target = this.targetExpr.execute(context);
            if (!!target && typeof target.apply === "function")
                return target.apply(this, args);

            throw new Error(`${this.targetExpr.toString() } is not a function`);
        }
        app(args: IExpr[]): IExpr {
            return new App(this.targetExpr, this.args.concat(args));
        }
    }

    class Unit implements IExpr {
        execute(context: IContext) {
            return undefined;
        }
        static instance = new Unit();
        app(): IExpr { throw new Error("app on unit is not supported"); }
    }

    class Not implements IExpr {
        constructor(public expr) { }
        execute(context: IContext) {
            return !this.expr.execute(context);
        }
        app(args: IExpr[]): IExpr {
            return new Not(this.expr.app(args));
        }
    }

    class Query implements IExpr {
        constructor(public varName: string, public sourceExpr: IExpr, public selectorExpr: IExpr) { }

        merge(context: IContext, x) {
            var item = {};
            item[this.varName] = x;
            var result = context.extend(item);

            if (this.selectorExpr !== null)
                return this.selectorExpr.execute(result);

            return result;
        }

        execute(context: IContext) {
            var result = this.sourceExpr.execute(context);
            var length = result.length;
            if (typeof length === "number") {
                //var arr = new Array(result.length);
                //for (var i = 0; i < arr.length; i++) {
                //    arr[i] = this.merge(context, result.prop(i));
                //}
                //return arr;
                return {
                    query: this,
                    length: length,
                    itemAt(idx) {
                        return this.query.merge(context, result.prop(idx));
                    },
                    forEach(fn) {
                        for (let idx = 0; idx < this.length; idx++) {
                            var merged = this.query.merge(context, result.prop(idx));
                            fn(merged, idx);
                        }
                    }
                }
            }
            else
                return result.map(x => this.merge(context, x));
        }
        app(): IExpr { throw new Error("app on query is not supported"); }
    }

    class Template {
        constructor(private parts) {

        }

        execute(context: IContext) {
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

        executePart(context: IContext, part) {
            if (typeof part === "string")
                return part;
            else {
                var result = part.execute(context);
                if (!!result && typeof result.call === "function")
                    return result.call(this);
                return result;
            }
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
            , boolean: /^(?:true|false)/g
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
            , compose: /^compose\b/g
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

        ws(stream): boolean {
            return !!this.parsePattern("whitespace", stream);
        }

        parseConst(stream): IExpr {
            const token = this.parsePattern("string1", stream) ||
                this.parsePattern("string2", stream) ||
                this.parsePattern("number", stream) ||
                this.parseRegex(/^(?:true|false|null)/g, stream);

            if (!token)
                return null;

            return new Const(eval(token));
        }

        parseBoolean(stream): IExpr {
            const token = this.parseRegex(/^(?:true|false)/g, stream);

            if (!token)
                return null;

            return new Const(token === "true");
        }

        parseIdent(stream): IExpr {
            const token = this.parsePattern("ident", stream);
            if (!token)
                return null;

            if (token === "not") {
                this.ws(stream);
                const expr = this.parseBoolean(stream) || this.parseIdent(stream);
                if (expr === null)
                    throw new SyntaxError(`Expected boolean expression at ${stream}`);
                return new Not(expr);
            }

            var ident: IExpr = new Ident(token);

            this.ws(stream);
            while (this.parsePattern("navigate", stream)) {
                this.ws(stream);
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
                this.ws(stream);
                const arg = this.parseExpr(stream);

                this.ws(stream);
                if (!this.parsePattern("rparen", stream))
                    throw new SyntaxError(`expected ')' at: '${stream}'`);
                return arg || Unit.instance;
            }
            return null;
        }

        parseQuery(stream): IExpr {
            if (this.parseRegex(/^for\b/g, stream) !== null) {
                this.ws(stream);
                const varName = this.parsePattern("ident", stream);
                if (varName === null)
                    throw new SyntaxError(`expected variable at: ${stream}`);

                if (this.parseRegex(/^\s*in\b/g, stream) === null)
                    throw new SyntaxError(`expected 'in' keyword at: '${stream}'`);

                this.ws(stream);
                var sourceExpr = this.parseExpr(stream);

                var selectorExpr = null;
                this.ws(stream);
                if (this.parsePattern("select", stream)) {
                    this.ws(stream);
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
                this.ws(stream);
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
            this.ws(stream);

            const expr =
                this.parseConst(stream) ||
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
                    throw new SyntaxError(`Expected filter at: ${stream}`);

                return filter.app([expr]);
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

            var appendText = (x) => {
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
                    const end = text.indexOf("}}", offset);
                    if (end >= 0) {
                        parts.push(this.expr(text.substring(offset, end)));
                        offset = end + 2;
                    } else {
                        throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
                    }
                } else {
                    appendText(text.substring(offset));
                    break;
                }
            }

            //if (parts.length === 1 && typeof parts[0] === "string")
            //    return new Const(parts[0]);

            return new Template(parts);
        }

        regex: RegExp;
    }
}

module Fun {
    export class List {
        static count(fn, list) {
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
        }
        static any(fn, list) {
            return List.count(fn, list) > 0;
        }
        static all(fn, list) {
            return List.count(fn, list) === list.length;
        }
        static filter(fn, list) {
            if (!list)
                return [];

            return list.filter(fn);
        }
        static map(fn, list) {
            if (!list)
                return [];

            return list.map(fn);
        }
        static empty(list) {
            return !list || list.length === 0;
        }
        static reduce(fn, initialValue, list) {
            return !list && list.reduce(fn, initialValue);
        }
    }
}