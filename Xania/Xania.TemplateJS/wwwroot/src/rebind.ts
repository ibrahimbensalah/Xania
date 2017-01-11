import { Core } from "./core";

export module Reactive {

    interface IExpressionParser {
        parse(expr: string): { execute(scope: { get (name: string) }) };
    }

    export class Store {

        private rootBinding: Binding;

        constructor(private model: any) {
            this.rootBinding = new Binding(new Core.Scope(model));
        }

        bind(selector: { execute(scope: { get(name: string) }) }, handler) {
            const result = selector.execute(this.rootBinding);
            handler(result);
        }

        get(name: string) {
            return new Store(this.model[name]);
        }

        extend(object: any) {
            return new Store(object);
        }
    }

    export class Binding implements Core.IScope {
        constructor(private scope: Core.Scope) {  }

        get(name: string): any {
        }

        extend(): Core.IScope {
            return this;
        }
    }
}