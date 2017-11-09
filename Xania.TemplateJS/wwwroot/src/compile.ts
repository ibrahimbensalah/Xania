import Expression from "./expression"
import peg from "../xania/query.peg";

declare function require(module: string);


export default function compile(expr, context = null) {
    var result = Expression.compile(peg.parse(expr), context);
    result['$debugView'] = expr;
    return result;
}

export function parse(expr) {
    return peg.parse(expr);
}

// export var TOKENS = { WHERE, QUERY, IDENT, MEMBER, APP, SELECT, CONST, RANGE, BINARY, AWAIT, PIPE, COMPOSE }
