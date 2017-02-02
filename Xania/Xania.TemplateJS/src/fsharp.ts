interface IAstVisitor {
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
            var arr = [];
            for (var i = first; i <= last; i++)
                arr.push(i);
            return arr;
        case AWAIT:
            return visitor.await(accept(ast.expr, visitor, context));
        default:
            return ast;
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

var empty = "";
export function parseTpl(text): { execute(visitor: IAstVisitor, context); } | string {
    var parts: any[] = [];

    var appendText = (x) => {
        var s = x.trim();
        if (s.length > 0) {
            parts.push(x);
        }
    };

    var offset = 0, textlength = text.length;
    while (offset < textlength) {
        var begin = text.indexOf("{{", offset);
        if (begin >= 0) {
            if (begin > offset)
                appendText(text.substring(offset, begin));

            offset = begin + 2;
            const end = text.indexOf("}}", offset);
            if (end >= 0) {
                parts.push(peg.parse(text.substring(offset, end)));
                offset = end + 2;
            } else {
                throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
            }
        } else {
            appendText(text.substring(offset));
            break;
        }
    }

    if (parts.length === 0)
        return null;

    if (parts.length === 1) {
        const part = parts[0];
        if (typeof part === "string")
            return part;
        return new Expression(part);
    }

    return {
        parts,
        execute(visitor, context) {
            var result = empty,
                parts = this.parts,
                length = parts.length,
                acc = accept;

            for (var i = 0; i < length; i++) {
                var p = acc(parts[i], visitor, context);
                if (p === void 0 || p === null)
                    return p;
                var inner = p.valueOf();
                if (inner === void 0)
                    return inner;
                if (inner !== null)
                    result += inner;
            }
            return result;
        }
    } as any;
}

