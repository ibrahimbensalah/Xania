import Expression from "./expression"

declare function require(module: string);

var peg = require("../lib/xania/query.peg");

export default function compile(expr) {
    return Expression.compile(peg.parse(expr));
}

export function parse(expr) {
    return peg.parse(expr);
}

// export var TOKENS = { WHERE, QUERY, IDENT, MEMBER, APP, SELECT, CONST, RANGE, BINARY, AWAIT, PIPE, COMPOSE }
