export interface IAstVisitor {
    where(source, predicate);
    select(source, selector);
    query(param, source);
    member(target, name);
    app(fun, args: any[], context?);
    extend(name: string, value: any);
    await(observable);
    const(value);
}

function empty(list) {
    return list.length === 0;
}

function single(list) {
    return list[0];
}

function equal(x, y) {
    return y === x;
}

function and(x, y) {
    return x && y;
}

function pipe(x, y) {
    return x(y);
}


function not(value) {
    return !value;
}

function or(x, y) {
    return x || y ? true : false;
}

function count(list) {
    return list.length;
}

// ReSharper disable InconsistentNaming
var THIS = 0;
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
var LAZY = 14;
var JOIN = 15;
var RECORD = 16;

var EQ = 17;
var OR = 18;
var AND = 19;
var NOT = 20;
// ReSharper restore InconsistentNaming

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

export class Scope {
    constructor(private contexts: any[]) {
    }

    get(name: string) {
        var contexts = this.contexts, length = contexts.length, i = 0;
        do {
            var target = this.contexts[i];
            var value = target.get ? target.get(name) : target[name];
            if (value !== void 0)
                return value;
        } while (++i < length)
        return void 0;
    }

    refresh() {
        var contexts = this.contexts, i = contexts.length;
        while (i--) {
            var ctx = contexts[i];
            if (ctx.refresh)
                ctx.refresh();
        }
    }
}

export default class Expression {
    constructor(public ast, private stack, private context) {
    }

    execute(contexts: any, binding: IAstVisitor) {
        var { stack } = this;

        var local = this.context;
        if (local) {
            if (Array.isArray(contexts))
                contexts = contexts.concat([local]);
            else if (contexts)
                contexts = [contexts, local];
            else
                contexts = local;
        }
        var context = Array.isArray(contexts) ? new Scope(contexts) : contexts;

        let idx = stack.length;
        while (idx--) {
            var ast = stack[idx];
            switch (ast.type) {
                case IDENT:
                    ast.value = binding.member(context, ast.name);
                    break;
                case QUERY:
                    ast.value = binding.query(ast.param, ast.source.value);
                    break;
                case CONST:
                    break;
                case MEMBER:
                    var target = ast.target.value;
                    var name = ast.member.value || ast.member;
                    ast.value = binding.member(target, name);
                    break;
                case AWAIT:
                    ast.value = binding.await(ast.expr.value);
                    break;
                case RANGE:
                    var first = ast.from.value;
                    var last = ast.to.value;
                    if (first === void 0 || last === void 0)
                        return void 0;
                    ast.value = new Range(first, last);
                    break;
                case BINARY:
                    var source;
                    switch (ast.op) {
                        case "->":
                            source = ast.left.value;

                            if (source === null)
                                return null;

                            if (source === void 0 || !source.valueOf())
                                return void 0;

                            ast.value = ast.right.compiled.execute(context, binding);
                            break;
                        case "where":
                        case WHERE:
                            source = ast.left.value;
                            let length = source.length;
                            var result = [];
                            for (var i = 0; i < length; i++) {
                                var item = binding.member(source, i);
                                var scope = new Scope([item, context]);
                                var b = ast.right.compiled.execute(scope, binding);
                                if (b)
                                    result.push(item);
                            }
                            ast.value = result;
                            break;
                        default:
                            var left = ast.left.value;
                            var right = ast.right.value;
                            ast.value = binding.app(ast.op, [right, left]);
                            break;
                    }
                    break;
                case APP:
                    let args;
                    let length = ast.args.length;
                    for (let i = 0; i < length; i++) {
                        var arg = ast.args[i].value;
                        if (arg === void 0)
                            return arg;
                        if (!args) args = [arg];
                        else args.push(arg);
                    }
                    var fun = ast.fun.value;
                    if (fun === void 0) {
                        console.error("could not resolve expression, " + JSON.stringify(ast.fun));
                        return void 0;
                    } else {
                        ast.value = binding.app(fun.valueOf(), args, ast.fun.target && ast.fun.target.value);
                    }
                    break;
                case LAZY:
                    ast.value = ast.expr(binding, context);
                    break;
                case NOT:
                    var value = ast.expr.value;
                    ast.value = !value || !value.valueOf();
                    break;
                default:
                    throw Error("unsupported ast type " + ast.type);
            }

            if (ast.value === void 0)
                return void 0;
        }

        return this.ast.value;
    }

    static compile(ast, context = null) {
        var queue = [];
        Expression.compileAst(ast, queue);
        return new Expression(ast, queue, context);
    }

    static compileAst(ast, stack: any[]) {
        const compile = Expression.compileAst;
        if (typeof ast === "object") {
            switch (ast.type) {
                case IDENT:
                    switch (ast.name) {
                        case "null":
                            ast.type = CONST;
                            ast.value = null;
                            break;
                        case "true":
                            ast.type = CONST;
                            ast.value = true;
                            break;
                        case "false":
                            ast.type = CONST;
                            ast.value = false;
                            break;
                        case "no":
                        case "empty":
                            ast.type = CONST;
                            ast.value = empty;
                            break;
                        case "single":
                            ast.type = CONST;
                            ast.value = single;
                            break;
                        case "count":
                            ast.type = CONST;
                            ast.value = count;
                            break;
                        case "not":
                            ast.type = CONST;
                            ast.value = not;
                            break;
                        case "or":
                            ast.type = CONST;
                            ast.value = or;
                            break;
                        case "this":
                            ast.type = THIS;
                            break;
                        default:
                            stack.push(ast);
                            break;
                    }
                    break;
                case QUERY:
                    stack.push(ast);
                    compile(ast.source, stack);
                    break;
                case MEMBER:
                    stack.push(ast);
                    compile(ast.member, stack);
                    compile(ast.target, stack);
                    break;
                case AWAIT:
                    stack.push(ast);
                    compile(ast.expr, stack);
                    // return visitor.await(accept(ast.expr, visitor, context));
                    break;
                case RANGE:
                    stack.push(ast);
                    compile(ast.from, stack);
                    compile(ast.to, stack);
                    break;
                case CONST:
                    stack.push(ast);
                    break;
                case LAZY:
                    stack.push(ast);
                    ast.expr = ast.bind(Expression.compile);
                    break;
                case BINARY:
                    stack.push(ast);
                    switch (ast.op) {
                        case "->":
                        case "where":
                        case WHERE:
                            ast.right.compiled = Expression.compile(ast.right);
                            compile(ast.left, stack);
                            break;
                        case PIPE:
                            ast.type = 5;
                            ast.fun = ast.right;
                            ast.args = [ast.left];
                            stack.push(ast);
                            compile(ast.left, stack);
                            compile(ast.right, stack);
                            break;
                        case EQ:
                            ast.op = equal;
                            compile(ast.right, stack);
                            compile(ast.left, stack);
                            break;
                        case OR:
                            ast.op = or;
                            compile(ast.right, stack);
                            compile(ast.left, stack);
                            break;
                        case AND:
                            ast.op = and;
                            compile(ast.right, stack);
                            compile(ast.left, stack);
                            break;
                        default:
                            compile(ast.right, stack);
                            compile(ast.left, stack);
                            break;
                    }
                    break;
                case APP:
                    stack.push(ast);
                    compile(ast.fun, stack);
                    var length = ast.args.length;
                    for (let i = 0; i < length; i++) {
                        compile(ast.args[i], stack);
                    }
                    break;
                case NOT:
                    stack.push(ast);
                    stack.push(ast.expr);
                    break;
                case LAMBDA:
                    break;
                default:
                    throw Error("unsupported ast type " + ast.type);
            }
        }
    }
}
