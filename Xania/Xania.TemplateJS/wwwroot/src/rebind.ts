export module Reactive {

    interface IExpressionParser {
        parse(expr: string): { execute(scope: { get (name: string) }) };
    }

    export class Store {
        constructor(private model: any) { }

        bind(selector: { execute(scope: { get(name: string) }) }, handler) {
            var result = selector.execute(this);
            handler(result);
        }

        get(name: string) {
            return this.model[name];
        }

        extend(object: any) {
            return new Store(object, this);
        }
    }

    export class Binding {
        
    }
}