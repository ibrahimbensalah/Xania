interface ErrorConstructor {
    captureStackTrace(thisArg: any, func: any): void
}

interface Function {
    buildMessage;
}

declare var fsharp;

declare function require(module: string);

interface IAstVisitor {
    where(source, predicate);
    select(source, selector);
    query(param, source);
    ident(name);
    member(target, name);
    app(fun, args: any[]);
    const(value);
}


