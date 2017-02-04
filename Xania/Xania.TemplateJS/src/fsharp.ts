export interface IAstVisitor {
    where(source, predicate);
    select(source, selector);
    query(param, source);
    member(target, name);
    app(fun, args: any[]);
    await(observable);
    const(value);
}

declare function require(module: string);

var peg = require("./fsharp.peg");

// var fsharp = peg.parse;

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
// ReSharper restore InconsistentNaming

export function accept(ast: any, visitor: IAstVisitor, context) {
    switch (ast.type) {
        case IDENT:
            return visitor.member(context, ast.name);
        case MEMBER:
            return visitor.member(accept(ast.target, visitor, context), accept(ast.member, visitor, context));
        case CONST:
            return visitor.const(ast.value);
        case BINARY:
            var left = accept(ast.left, visitor, context);
            var right = accept(ast.right, visitor, context);

            if (left === void 0 || right === void 0)
                return undefined;

            return visitor.app(ast.op, [right, left]);
        case APP:
            const args = [];
            for (let i = 0; i < ast.args.length; i++) {
                var arg = accept(ast.args[i], visitor, context);
                if (arg === void 0)
                    return arg;
                args.push(arg);
            }
            return visitor.app(accept(ast.fun, visitor, context), args);
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
            // TODO lazy impl
            return new Range(first.valueOf(), last.valueOf());
        case AWAIT:
            return visitor.await(accept(ast.expr, visitor, context));
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
        return accept(this.ast, binding, context);
    }
}

export var TYPES = { WHERE, QUERY, IDENT, MEMBER, APP, SELECT, CONST, RANGE, BINARY, AWAIT, PIPE, COMPOSE }
