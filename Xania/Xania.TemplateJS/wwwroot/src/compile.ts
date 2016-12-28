module Xania.Compile {

    export interface IRuntimeProvider {
        prop(object: any, name: string): any;
        apply(fun: Function, args: any[]);
        global(name: string): any;
    }

    interface IExpr {
        compile<T>(runtimeProvider: IRuntimeProvider);
    }

    class DefaultRuntimeProvider {
        static prop(context: any, name: string): any {
            return context[name];
        }
        static apply(fun: Function, args: any[]) {
            return fun.apply(null, args);
        }
        static global(name: string) {
            return window[name];
        }
    }

    export class Ident implements IExpr {
        constructor(private name: string) { }

        compile(runtimeProvider: IRuntimeProvider) {
            return runtimeProvider.global(this.name);
        }

        toString() { return this.name; }
    }

    export class Member implements IExpr {

        constructor(private name: string) {
        }

        compile(runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider) : Function {
            return obj => runtimeProvider.prop(obj, this.name);
        }

        toString() {
            return `(.${this.name})`;
        }
    }

    export class Const implements IExpr {
        constructor(private value: any, private display?) { }

        compile(runtimeProvider: IRuntimeProvider) {
            return this.value;
        }

        toString() {
            return this.display || this.value;
        }
    }

    export class Pipe implements IExpr {

        constructor(private left: IExpr, private right: IExpr) { }

        compile<T>(runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider) {
            var leftResult = this.left.compile(runtimeProvider);
            var rightResult = this.right.compile(runtimeProvider);

            return () => {
                var data = typeof leftResult === "function" ? leftResult() : leftResult;
                return rightResult(data);
            };
        }

        toString() {
            return "("  + this.left + " |> " + this.right + " )";
        }
    }

    export class App implements IExpr {
        constructor(private fun: IExpr, private args: IExpr[]) {}

        compile(runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider) {
            var args = this.args.map(x => x.compile(runtimeProvider));
            var fun: Function = !!this.fun.compile ? this.fun.compile(runtimeProvider) : this.fun;

            return (additionalArg: any[] = []) => runtimeProvider.apply(fun, args.concat([additionalArg]));
        }

        toString() {
            return this.fun.toString() + " " + this.args.map(x => x.toString()).join(" ") + "";
        }
    }

    export class Not implements IExpr {
        static inverse(x) {
            return !x;
        }

        constructor(private expr: IExpr) {
            
        }

        compile(runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider): boolean | Function {
            var value = this.expr.compile(runtimeProvider);
            if (typeof value === "function")
                return obj => !value(obj);
            return !value;
        }

        toString() {
            return "(not " + this.expr.toString() + ")";
        }
    }


}