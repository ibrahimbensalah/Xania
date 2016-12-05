﻿module Xania.Ast {
    interface IExpr {
        execute(context: any, provider: IRuntimeProvider);
        app(args: IExpr[]): IExpr;
    }

    class Const implements IExpr {
        constructor(public value: any) { }
        execute() {
            return this.value;
        }
        app(args: IExpr[]): IExpr {
            return new App(this, args);
        }
        toString() {
            return `'${this.value}'`;
        }
    }

    class Ident implements IExpr {
        constructor(public id: string) { }

        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            return provider.get(context, this.id);
        }
        app(args: IExpr[]): IExpr {
            return new App(this, args);
        }
        toString() {
            return this.id;
        }
    }

    class Member implements IExpr {
        constructor(public targetExpr: IExpr, public name: string) {
        }

        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            const obj = this.targetExpr.execute(context, provider);
            return provider.get(obj, this.name);
        }
        app(args: IExpr[]): IExpr {
            return new App(this, args);
        }
        toString() {
            return `${this.targetExpr}.${this.name}`;
        }
    }

    class App implements IExpr {
        constructor(public targetExpr: IExpr, public args: IExpr[]) {
        }

        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            let args = this.args.map(x => x.execute(context, provider));

            const target = this.targetExpr.execute(context, provider);

            if (!target)
                throw new Error(`${this.targetExpr.toString()} is undefined or null.`);

            return provider.invoke(context, target, args);
        }
        app(args: IExpr[]): IExpr {
            return new App(this.targetExpr, this.args.concat(args));
        }

        toString() {
            var str = this.targetExpr.toString();
            for (var i = 0; i < this.args.length; i++) {
                str += ` ${this.args[i]}`;
            }
            return `(${str})`;
        }
    }

    class Unit implements IExpr {
        execute() {
            return undefined;
        }
        static instance = new Unit();
        app(): IExpr { throw new Error("app on unit is not supported"); }

        toString() {
            return `unit`;
        }
    }

    class Not implements IExpr {
        constructor(public expr: IExpr) { }
        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            return !this.expr.execute(context, provider);
        }
        app(args: IExpr[]): IExpr {
            return new Not(this.expr.app(args));
        }

        toString() {
            return `not ${this.expr}`;
        }
    }

    class BinaryOperator {
        static equals = (x, y) => {
            return (!!x ? x.valueOf() : x) === (!!y ? y.valueOf() : y);
        };
        static add = (x, y) => x + y;
        static substract = (x, y) => x - y;
        static pipe = (x, y) => x(y);
    }

    class Selector implements IExpr {
        private query;

        constructor(private expr: IExpr) {
        }

        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            var list = this.query.execute(context, provider);
            var selector = this.expr;
            return {
                length: list.length,
                itemAt(idx) {
                    var ctx = provider.itemAt(list, idx);
                    var result = selector.execute(ctx, provider);
                    return result;
                },
                forEach(fn) {
                    var l = length;
                    for (let idx = 0; idx < l; idx++) {
                        fn(this.itemAt(idx), idx);
                    }
                }
            }
        }

        app(args: IExpr[]): IExpr {
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
        }
    }

    class Query implements IExpr {
        constructor(public varName: string, public sourceExpr: IExpr) { }

        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            var result = this.sourceExpr.execute(context, provider);
            return {
                varName: this.varName,
                context,
                provider,
                extend(x) {
                    return this.provider.extend(this.context, this.varName, x);
                },
                map(fn) {
                    return this.provider.map(result, (x, idx) => fn(this.extend(x), idx));
                },
                forEach(fn) {
                    return this.provider.forEach(result, (x, idx) => fn(this.extend(x), idx));
                }
            }
        }
        app(): IExpr { throw new Error("app on query is not supported"); }

        toString() {
            return `(for ${this.varName} in ${this.sourceExpr})`;
        }
    }

    interface IRuntimeProvider {
        itemAt(arr: any, idx: number): any;
        get(obj: any, name: string): any;
        extend(context, varName: string, x: any);
        invoke(context, invocable, args: any[]);
        forEach(data, fn);
        map(data, fn);
    }

    class Template {
        constructor(private parts: IExpr[]) {
        }

        execute(context, provider: IRuntimeProvider = DefaultRuntimeProvider) {
            if (this.parts.length === 0)
                return "";

            if (this.parts.length === 1)
                return this.executePart(this.parts[0], context, provider);

            var result = "";
            for (var i = 0; i < this.parts.length; i++) {
                result += this.executePart(this.parts[i], context, provider);
            }
            return result;
        }

        executePart(part: IExpr | string, context, provider: IRuntimeProvider) {
            if (typeof part === "string")
                return part;
            else {
                return part.execute(context, provider);
            }
        }

        toString() {
            var result = "";
            for (var i = 0; i < this.parts.length; i++) {
                result += this.parts[i];
            }
            return result;
        }
    }

    class UnaryOperator implements IExpr {
        constructor(private handler: Function) {
        }
        execute() { }
        app(args: IExpr[]): IExpr {
            throw new Error("Not implemented");
        }
    }

    interface IObserver {

    }

    class DefaultRuntimeProvider {

        static itemAt(arr, idx: number) {
            return !!arr.itemAt ? arr.itemAt(idx) : arr[idx];
        }
        static get(obj, name: string) {
            return !!obj.get ? obj.get(name) : obj[name];
        }
        static extend(context, varName: string, x: any) {
            if (!!context.extend) {
                return context.extend(varName, x);
            } else {
                var item = {};
                item[varName] = x;
                return Object.assign(item, context);
            }
        }
        static forEach(arr, fn) {
            return arr.forEach(fn);
        }
        static map(arr, fn) {
            return arr.map(fn);
        }
        static invoke(context, invocable, args: any[]) {
            return invocable.apply(context, args);
            //if (typeof target.execute === "function")
            //    return provider.invoke(target, args);
            //// return target.execute.apply(target, args);
            //else if (typeof target.apply === "function")
            //    return target.apply(this, args);

            //throw new Error(`${this.targetExpr.toString()} is not a function`);
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
            , operator: /^[\|>=\+\-]+/g
            // , pipe2: /^\|\|>/g
            // , select: /^->/g
            , compose: /^compose\b/g
            , eq: /^\s*=\s*/g
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

        parseOperator(stream): IExpr {
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
                        throw new SyntaxError(`unresolved operator '${op}'`);
                }
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

                return new Query(varName, sourceExpr);
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

            let expr =
                this.parseConst(stream) ||
                this.parseParens(stream) ||
                this.parseQuery(stream) ||
                this.parseIdent(stream);

            if (!expr) {
                return null;
            }

            this.ws(stream);
            const operator = this.parseOperator(stream);
            if (!!operator) {
                expr = operator.app([expr]);
                //const right = this.parseExpr(stream);
                //if (!right)
                //    throw new SyntaxError(`Expected filter at: ${stream}`);

                //return binary(
                //    expr, right);
            }

            var args = this.parseArgs(stream);
            if (args !== null) {
                return expr.app(args);
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

module Xania.Fun {
    export class List {
        static count(fn, list) {
            if (!list)
                return 0;
            var result = 0;
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
            var retval = [];

            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (!!fn(item)) {
                    retval.push(item);
                }
            }

            return retval;
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

