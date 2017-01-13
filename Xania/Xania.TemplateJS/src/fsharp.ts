interface IAstVisitor {
    where(source, predicate);
    select(source, selector);
    query(param, source);
    ident(name);
    member(target, name);
    app(fun, args: any[]);
    const(value);
}

declare function require(module: string);

var peg = require("./fsharp.peg");

// var fsharp = peg.parse;

export function accept(ast: any, visitor: IAstVisitor) {
    if (ast === null || ast === undefined)
        return null;

    if (ast.type === undefined)
        return ast;

    switch (ast.type) {
        case "where":
            return visitor.where(accept(ast.source, visitor), accept(ast.predicate, visitor));
        case "query":
            return visitor.query(ast.param, accept(ast.source, visitor));
        case "ident":
            return visitor.ident(ast.name);
        case "member":
            return visitor.member(accept(ast.target, visitor), accept(ast.member, visitor));
        case "app":
            const args = [];
            for (let i = 0; i < ast.args.length; i++) {
                args.push(accept(args[i], visitor));
            }
            return visitor.app(accept(ast.fun, visitor), args);
        case "select":
            return visitor.select(accept(ast.source, visitor), accept(ast.selector, visitor));
        case "const":
            return visitor.const(ast.value);
        default:
            throw new Error(`not supported type ${ast.type}`);
    }
}

export var fsharp = peg.parse;

