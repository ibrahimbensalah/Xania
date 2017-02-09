export interface IAstVisitor {
    where(source, predicate);
    select(source, selector);
    query(param, source);
    member(target, name);
    app(fun, args: any[]);
    extend(name: string, value: any);
    await(observable);
    const(value);
}

declare function require(module: string);

var peg = require("./fsharp.peg");

function empty(list) {
    return list.length === 0;
}

function not(value) {
    return !value;
}

function count(list) {
    return list.length;
}

// ReSharper disable InconsistentNaming
var WHERE = 1;
var QUERY = 2;
var IDENT = 3;
var MEMBER = 4;
var APP = 5;
var SELECT = 6;
var CONST = 7;
var RANGE = 8;
var BINARY = 9;
var AWAIT = 10;
var PIPE = 11;
var COMPOSE = 12;
var LAMBDA = 13;
// ReSharper restore InconsistentNaming

export function accept(ast: any, visitor: IAstVisitor, context) {
    var length;
    switch (ast.type) {
        case IDENT:
            switch (ast.name) {
                case "null":
                    return null;
                case "true":
                    return true;
                case "false":
                    return false;
                case "no":
                case "empty":
                    return empty;
                case "count":
                    return count;
                case "not":
                    return not;
                default:
                    return visitor.member(context, ast.name);
            }
        case MEMBER:
            return visitor.member(accept(ast.target, visitor, context), accept(ast.member, visitor, context));
        case CONST:
            return visitor.const(ast.value);
        case BINARY:
            var source;
            switch (ast.op) {
                case "->":
                    source = accept(ast.left, visitor, context);

                    if (source === void 0)
                        return void 0;

                    return source.valueOf() ? accept(ast.right, visitor, context) : void 0;
                case WHERE:
                    source = accept(ast.left, visitor, context);
                    length = visitor.member(source, "length").value;
                    var result = [];
                    for (var i = 0; i < length; i++) {
                        var item = visitor.member(source, i);
                        var scope = new Scope(visitor, [item, context]);
                        var b = accept(ast.right, visitor, scope).valueOf();
                        if (b)
                            result.push(item);
                    }
                    return result;
                default:
                    var left = accept(ast.left, visitor, context);
                    var right = accept(ast.right, visitor, context);

                    if (left === void 0 || right === void 0)
                        return void 0;

                    return visitor.app(ast.op, [right, left]);
            }

        case APP:
            let args;
            length = ast.args.length;
            for (let i = 0; i < length; i++) {
                var arg = accept(ast.args[i], visitor, context);
                if (arg === void 0)
                    return arg;
                if (!args) args = [arg];
                else args.push(arg);
            }
            var fun = accept(ast.fun, visitor, context);
            if (fun === void 0) {
                console.error("could not resolve expression, " + JSON.stringify(ast.fun));
                return void 0;
            } else
                return visitor.app(fun, args);
        case QUERY:
            return visitor.query(ast.param, accept(ast.source, visitor, context));
        case SELECT:
            return visitor.select(accept(ast.source, visitor, context), s => accept(ast.selector, visitor, s));
        case WHERE:
            return visitor.where(accept(ast.source, visitor, context), accept(ast.predicate, visitor, context));
        case RANGE:
            var first = accept(ast.from, visitor, context);
            var last = accept(ast.to, visitor, context);
            if (first === void 0 || last === void 0)
                return first;
            return new Range(first.valueOf(), last.valueOf());
        case AWAIT:
            return visitor.await(accept(ast.expr, visitor, context));
        case LAMBDA:
            return model => {
                var context = visitor.extend(ast.param, model);
                return accept(ast.body, visitor, context);
            }
        default:
            return ast;
    }
}

class Range {
    constructor(private first, private last) {
    }

    map(fn) {
        var result = [], last = this.last;
        for (var i = this.first; i <= last; i++) {
            result.push(fn(i));
        }
        return result;
    }
}

export var fsharp = peg.parse;

export function fs(expr) {
    return new Expression(peg.parse(expr));
}

class Expression {
    constructor(private ast) {
    }
    execute(binding: IAstVisitor, context: any) {
        if (Array.isArray(context))
            return accept(this.ast, binding, new Scope(binding, context));
        else
            return accept(this.ast, binding, context);
    }
}

export class Scope {
    constructor(private visitor: IAstVisitor, private contexts: any[]) {
    }

    get(name: string) {
        var visitor = this.visitor;
        var contexts = this.contexts;
        for (var i = 0; i < this.contexts.length; i++) {
            var value = visitor.member(contexts[i], name);
            if (value !== void 0)
                return value;
        }

        return void 0;
    }
}

export var TOKENS = { WHERE, QUERY, IDENT, MEMBER, APP, SELECT, CONST, RANGE, BINARY, AWAIT, PIPE, COMPOSE }
