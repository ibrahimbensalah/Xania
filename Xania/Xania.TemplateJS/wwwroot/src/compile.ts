module Xania.Compile {

    interface IRuntimeProvider {
        prop(context: any, name: string): any;
        invoke(fun: Function, args: any[]);
    }

    interface IExpr {
        execute(context: any, runtimeProvider: IRuntimeProvider);
    }

    class DefaultRuntimeProvider {
        static prop(context: any, name: string): any {
            return context[name];
        }
        static invoke(fun: Function, args: any[]) {
            return fun.apply(null, args);
        }
    }

    export class Member implements IExpr {

        constructor(private name: string) { }
        execute(context, runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider) {
            return runtimeProvider.prop(context, this.name);
        }
    }

    export class Const implements IExpr {
        constructor(private value: any) { }

        execute(context, runtimeProvider: IRuntimeProvider) {
            return this.value;
        }
    }

    export class Pipe implements IExpr {

        constructor(private left: IExpr, private right: IExpr) { }

        execute(context, runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider) {
            var leftResult = this.left.execute(context, runtimeProvider);

            return this.right.execute(leftResult, runtimeProvider);
        }
    }

    export class App implements IExpr {
        constructor(private fun: IExpr, private args: IExpr[]) {}

        execute(context, runtimeProvider: IRuntimeProvider = DefaultRuntimeProvider) {

            var args = this.args.map(x => x.execute(context, runtimeProvider));

            var fun: Function = !!this.fun.execute ? this.fun.execute(context, runtimeProvider) : this.fun;

            // var fun: Function = this.fun.execute(context, runtimeProvider);

            return runtimeProvider.invoke(fun, args);
        }
    }

    export class Not implements IExpr{
        static inverse(x) {
            return !x;
        }

        constructor(private expr: IExpr) {
            
        }

        execute(context, runtimeProvider: IRuntimeProvider) {
            
        }
    }


}