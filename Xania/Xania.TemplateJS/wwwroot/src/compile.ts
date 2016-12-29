module Xania.Compile {
    var undefined = void 0;
    export interface IRuntime {
        get(object: any, name: string): any;
        apply(fun: Function, args: any[], context?: any);
        variable(name: string): any;
    }

    export class ScopeRuntime implements IRuntime {
        private scope = {};

        constructor(private parent: IRuntime = DefaultRuntime, private globals = {}) {
        }

        set(name: string, value: any) {
            if (value === undefined) {
                throw new Error("value is undefined");
            }

            if (this.variable(name) !== undefined) {
                throw new Error("modifying value is not permitted.");
            }

            this.scope[name] = value;
            return this;
        }

        get(object, name: string) {
            return this.parent.get(object, name);
        }

        apply(fun: Function, args: any[], context: any) {
            return this.parent.apply(fun, args, context);
        }

        variable(name: string) {
            var value;
            value = this.scope[name];
            if (value !== undefined) {
                return value;
            }
            value = this.globals[name];
            if (value !== undefined) {
                return value;
            }
            return this.parent.variable(name);
        }
    }

    interface IExpr {
        execute(runtime: IRuntime);

        app(args: IExpr[]): App;
    }

    class DefaultRuntime {
        static get(context: any, name: string): any {
            var value = context[name];

            if (typeof value === "function")
                value = value.bind(context);

            return value;
        }
        static apply(fun: Function, args: any[], context: any) {
            return fun.apply(context, args);
        }
        static variable(name: string) {
            return window[name];
        }
    }

    export class Ident implements IExpr {
        constructor(public name: string) { }

        execute(runtime: IRuntime) {
            return runtime.variable(this.name);
        }

        toString() { return this.name; }

        app(args: IExpr[]): App {
            return new App(this, args);
        }
    }

    export class Member implements IExpr {
        constructor(private target: IExpr, private member: string | IExpr) {
        }

        execute(runtime: IRuntime = DefaultRuntime): Function {
            var obj = this.target.execute(runtime);

            if (typeof this.member === "string")
                return runtime.get(obj, this.member);

            var scope = new ScopeRuntime(runtime, obj);
            return this.member.execute(scope);
        }

        toString() {
            return `${this.target}.${this.member}`;
        }

        app(args: IExpr[]): App {
            return new App(this, args);
        }
    }

    export class ModelParameter {
        constructor(public name) {
        }

        toString() {
            return this.name;
        }
    }

    export class Lambda implements IExpr {

        constructor(private modelNames: string[], private body: IExpr) {
        }

        execute(runtime: IRuntime = DefaultRuntime): Function {
            return (...models) => {
                var scope = new ScopeRuntime(runtime);

                for (var i = 0; i < this.modelNames.length; i++) {
                    var n = this.modelNames[i];
                    var v = models[i];

                    if (v === undefined)
                        throw new Error(`value of ${n} is undefined :: ${this.toString()}`);

                    scope.set(n, v);
                }

                return this.body.execute(scope);
            };
        }

        app(args: IExpr[]): App {
            if (args.length !== this.modelNames.length)
                throw new Error("arguments mismatch");

            return new App(this, args);
        }

        toString() {
            return `(fun ${this.modelNames.join(" ")} -> ${this.body})`;
        }

        static member(name: string): Lambda {
            return new Lambda(["m"], new Member(new Ident("m"), new Ident(name)));
        }
    }

    export class Const implements IExpr {
        constructor(private value: any, private display?) { }

        execute(runtime: IRuntime) {
            return this.value;
        }

        toString() {
            return this.display || this.value;
        }

        app(args: IExpr[]): App {
            return new App(this, args);
        }
    }

    export class Pipe implements IExpr {

        constructor(private left: IExpr, private right: IExpr) { }

        execute(runtime: IRuntime = DefaultRuntime) {
            return this.right.app([this.left]).execute(runtime);
        }

        toString() {
            return "" + this.left + " |> " + this.right + "";
        }

        app(args: IExpr[]): App {
            throw new Error("Not supported");
        }
    }

    interface IQuery {
        execute(runtime: IRuntime): Array<IRuntime>;
    }

    export class Select implements IExpr {
        constructor(private query: IQuery, private selector: IExpr) {
        }

        execute(runtime: IRuntime = DefaultRuntime) {
            return this.query.execute(runtime).map(scope => this.selector.execute(scope));
        }

        toString() {
            return `${this.query} select ${this.selector}`;
        }

        app(args: IExpr[]): App {
            throw new Error("Not supported");
        }
    }

    export class Where implements IQuery {
        constructor(private query: IQuery, private predicate: IExpr) { }

        execute(runtime: IRuntime = DefaultRuntime): IRuntime[] {
            return this.query.execute(runtime).filter(scope => this.predicate.execute(scope));
        }

        toString() {
            return `${this.query} where ${this.predicate}`;
        }
    }

    export class OrderBy implements IQuery {
        constructor(private query: IQuery, private selector: IExpr) { }

        execute(runtime: IRuntime = DefaultRuntime): IRuntime[] {
            return this.query.execute(runtime).sort((x, y) => this.selector.execute(x) > this.selector.execute(y) ? 1 : -1);
        }

        toString() {
            return `${this.query} orderBy ${this.selector}`;
        }
    }

    class Group extends ScopeRuntime {
        public scopes: IRuntime[] = [];

        constructor(parent: IRuntime, public key: any, private into: string) {
            super(parent);

            super.set(into, this);
        }

        count() {
            return this.scopes.length;
        }
    }

    export class GroupBy implements IQuery {
        constructor(private query: IQuery, private selector: IExpr, private into: string) { }

        execute(runtime: IRuntime = DefaultRuntime): IRuntime[] {
            var groups: Group[] = [];
            this.query.execute(runtime).forEach(scope => {
                var key = this.selector.execute(scope);

                var g: Group = null;
                for (var i = 0; i < groups.length; i++) {
                    if (groups[i].key === key) {
                        g = groups[i];
                    }
                }
                if (!g)
                    groups.push(g = new Group(runtime, key, this.into));
                g.scopes.push(scope);
            });

            return groups;
        }

        toString() {
            return `${this.query} groupBy ${this.selector} into ${this.into}`;
        }
    }

    export class Query implements IQuery {
        constructor(private itemName: string, private sourceExpr: IExpr) { }

        execute(runtime: IRuntime = DefaultRuntime): Array<IRuntime> {
            var source = this.sourceExpr.execute(runtime);
            return source.map(item => new ScopeRuntime(runtime).set(this.itemName, item));
        }

        toString() {
            return `for ${this.itemName} in ${this.sourceExpr} do`;
        }
    }

    export class App implements IExpr {
        constructor(public fun: IExpr, public args: IExpr[] = []) { }

        execute(runtime: IRuntime = DefaultRuntime) {
            var args = this.args.map(x => x.execute(runtime));

            let fun: Function = this.fun.execute(runtime);
            return runtime.apply(fun, args);
        }

        toString() {
            if (this.args.length === 0)
                return this.fun.toString() + " ()";
            return this.fun.toString() + " " + this.args.map(x => x.toString()).join(" ") + "";
        }

        app(args: IExpr[]) {
            return new App(this.fun, this.args.concat(args));
        }
    }

    export class Not implements IExpr {
        static inverse(x) {
            return !x;
        }

        constructor(private expr: IExpr) {

        }

        execute(runtime: IRuntime = DefaultRuntime): boolean | Function {
            var value = this.expr.execute(runtime);
            if (typeof value === "function")
                return obj => !value(obj);
            return !value;
        }

        toString() {
            return "(not " + this.expr.toString() + ")";
        }

        app(args: IExpr[]): App {
            throw new Error("Not supported");
        }
    }


}