interface ErrorConstructor {
    captureStackTrace(thisArg: any, func: any): void
}

interface Function {
    buildMessage;
}

declare var fsharp;

declare function require(module: string);