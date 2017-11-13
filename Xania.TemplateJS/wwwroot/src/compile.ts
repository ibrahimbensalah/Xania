import Expression from "./expression"
import { parse } from "../xania/query.peg";

export default function compile(expr, context = null) {
    var result = Expression.compile(parse(expr), context);
    result['$debugView'] = expr;
    return result;
}

export function parse(expr) {
    return parse(expr);
}

// export var TOKENS = { WHERE, QUERY, IDENT, MEMBER, APP, SELECT, CONST, RANGE, BINARY, AWAIT, PIPE, COMPOSE }
