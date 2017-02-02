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
const WHERE = "where";
const QUERY = "query";
const IDENT = "ident";
const MEMBER = "member";
const APP = "app";
const SELECT = "select";
const CONST = "const";
const RANGE = "range";
const BINARY = "binary";
const AWAIT = "await";
// ReSharper restore InconsistentNaming

export function accept(ast: any, visitor: IAstVisitor, context) {
    if (ast.type === undefined)
        return ast;

    switch (ast.type) {
        case WHERE:
            return visitor.where(accept(ast.source, visitor, context), accept(ast.predicate, visitor, context));
        case QUERY:
            return visitor.query(ast.param, accept(ast.source, visitor, context));
        case IDENT:
            return visitor.member(context, ast.name);
        case MEMBER:
            return visitor.member(accept(ast.target, visitor, context), accept(ast.member, visitor, context));
        case APP:
            const args = [];
            for (let i = 0; i < ast.args.length; i++) {
                var arg = accept(ast.args[i], visitor, context);
                if (arg === void 0)
                    return arg;
                args.push(arg);
            }
            return visitor.app(accept(ast.fun, visitor, context), args);
        case SELECT:
            return visitor.select(accept(ast.source, visitor, context), s => accept(ast.selector, visitor, s));
        case CONST:
            return visitor.const(ast.value);
        case RANGE:
            var first = accept(ast.from, visitor, context);
            var last = accept(ast.to, visitor, context);
            if (first === void 0 || last === void 0)
                return undefined;
            var arr = [];
            for (var i = first; i <= last; i++)
                arr.push(i);
            return arr;
        case BINARY:
            var left = accept(ast.left, visitor, context);
            var right = accept(ast.right, visitor, context);

            if (left === void 0 || right === void 0)
                return undefined;

            return visitor.app(ast.op, [right, left]);
        case AWAIT:
            return visitor.await(accept(ast.expr, visitor, context));
        default:
            throw new Error(`not supported type ${ast.type}`);
    }
}

export var fsharp = peg.parse;

export function fs(expr) {
    return {
        ast: peg.parse(expr),
        execute(binding: IAstVisitor, context: any) {
            return accept(this.ast, binding, context);
        }
    }
}