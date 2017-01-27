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

export function accept(ast: any, visitor: IAstVisitor, context) {
    if (ast === null || ast === undefined)
        return null;

    if (ast.type === undefined)
        return ast;

    switch (ast.type) {
        case "where":
            return visitor.where(accept(ast.source, visitor, context), accept(ast.predicate, visitor, context));
        case "query":
            return visitor.query(ast.param, accept(ast.source, visitor, context));
        case "ident":
            return visitor.member(context, ast.name);
        case "member":
            return visitor.member(accept(ast.target, visitor, context), accept(ast.member, visitor, context));
        case "app":
            const args = [];
            for (let i = 0; i < ast.args.length; i++) {
                var arg = accept(ast.args[i], visitor, context);
                if (typeof arg === "undefined")
                    return undefined;
                args.push(arg);
            }
            return visitor.app(accept(ast.fun, visitor, context), args);
        case "select":
            return visitor.select(accept(ast.source, visitor, context), s => accept(ast.selector, visitor, s));
        case "const":
            return visitor.const(ast.value);
        case "range":
            var first = accept(ast.from, visitor, context);
            var last = accept(ast.to, visitor, context);
            if (typeof first === "undefined" || typeof last === "undefined")
                return undefined;
            var arr = [];
            for (var i = first; i <= last; i++)
                arr.push(i);
            return arr;
        case "binary":
            var left = accept(ast.left, visitor, context);
            var right = accept(ast.right, visitor, context);

            if (typeof left === "undefined" || typeof right === "undefined")
                return undefined;

            return visitor.app(ast.op, [right, left]);
        case "await":
            return visitor.await(accept(ast.expr, visitor, context));
        case "pipe":
            throw Error("Not implement yet");
        default:
            throw new Error(`not supported type ${ast.type}`);
    }
}

export var fsharp = peg.parse;

