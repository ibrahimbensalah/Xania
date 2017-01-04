module Xania.Compile {
    var undefined = void 0;
    export interface IScope {
        get(object: any, name: string): any;
        // apply(fun: Function, args: any[], context?: any);
        variable(name: string): any;
    }

    export class Scope implements IScope {
        private scope = {};

        constructor(private parent: IScope = DefaultScope, private globals = {}) {
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
        execute(scope: IScope);

        app(args: IExpr[]): IExpr;
    }

    class DefaultScope {
        static get(context: any, name: string): any {
            var value = context[name];

            if (typeof value === "function")
                value = value.bind(context);

            return value;
        }
        static apply(fun: Function, args: any[], context: any) {
            return (<any>fun).apply(context, args);
        }
        static variable(name: string) {
            return window[name];
        }
    }

    export class Ident implements IExpr {
        constructor(public name: string) { }

        execute(scope: IScope) {
            return scope.variable(this.name);
        }

        toString() { return this.name; }

        app(args: IExpr[]): App {
            return new App(this, args);
        }
    }

    export class Member implements IExpr {
        constructor(private target: IExpr, private member: string | IExpr) {
        }

        execute(scope: IScope = DefaultScope): Function {
            var obj = this.target.execute(scope);

            if (typeof this.member === "string")
                return scope.get(obj, this.member as string);
            return (<IExpr>this.member).execute(new Scope(scope, obj));
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

        execute(scope: IScope = DefaultScope): Function {
            return (...models) => {
                var childScope = new Scope(scope);

                for (var i = 0; i < this.modelNames.length; i++) {
                    var n = this.modelNames[i];
                    var v = models[i];

                    if (v === undefined)
                        throw new Error(`value of ${n} is undefined :: ${this.toString()}`);

                    childScope.set(n, v);
                }

                return this.body.execute(childScope);
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

        execute(scope: IScope) {
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

        execute(scope: IScope = DefaultScope) {
            return this.right.app([this.left]).execute(scope);
        }

        toString() {
            return "" + this.left + " |> " + this.right + "";
        }

        app(args: IExpr[]): App {
            throw new Error("Not supported");
        }
    }

    interface IQuery {
        execute(scope: IScope): Array<IScope>;
    }

    export class Select implements IExpr {
        constructor(private query: IQuery, private selector: IExpr) {
        }

        execute(scope: IScope = DefaultScope) {
            return this.query.execute(scope).map(scope => this.selector.execute(scope));
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

        execute(scope: IScope = DefaultScope): IScope[] {
            return this.query.execute(scope).filter(scope => this.predicate.execute(scope));
        }

        toString() {
            return `${this.query} where ${this.predicate}`;
        }
    }

    export class OrderBy implements IQuery {
        constructor(private query: IQuery, private selector: IExpr) { }

        execute(scope: IScope = DefaultScope): IScope[] {
            return this.query.execute(scope).sort((x, y) => this.selector.execute(x) > this.selector.execute(y) ? 1 : -1);
        }

        toString() {
            return `${this.query} orderBy ${this.selector}`;
        }
    }

    class Group extends Scope {
        public scopes: IScope[] = [];

        constructor(parent: IScope, public key: any, private into: string) {
            super(parent);

            super.set(into, this);
        }

        count() {
            return this.scopes.length;
        }
    }

    export class GroupBy implements IQuery {
        constructor(private query: IQuery, private selector: IExpr, private into: string) { }

        execute(scope: IScope = DefaultScope): IScope[] {
            var groups: Group[] = [];
            this.query.execute(scope).forEach(scope => {
                var key = this.selector.execute(scope);

                var g: Group = null;
                for (var i = 0; i < groups.length; i++) {
                    if (groups[i].key === key) {
                        g = groups[i];
                    }
                }
                if (!g)
                    groups.push(g = new Group(scope, key, this.into));
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

        execute(scope: IScope = DefaultScope): Array<IScope> {
            var source = this.sourceExpr.execute(scope);
            return source.map(item => new Scope(scope).set(this.itemName, item));
        }

        toString() {
            return `for ${this.itemName} in ${this.sourceExpr} do`;
        }
    }

    export class App implements IExpr {
        constructor(public fun: IExpr, public args: IExpr[] = []) { }

        execute(scope: IScope = DefaultScope) {
            var args = this.args.map(x => x.execute(scope));

            var fun = this.fun.execute(scope);

            return fun.apply(null, args);
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

    export class Unary implements IExpr {
        constructor(private fun: IExpr, private args: IExpr[]) {
        }

        execute(scope: IScope = DefaultScope) {
            return (arg) => {
                var args = this.args.map(x => x.execute(scope));
                args.push(arg);

                var fun = this.fun.execute(scope);

                return fun.apply(null, args);
            }
        }

        app(args: IExpr[]): IExpr {
            if (!!args || args.length === 0)
                return this;

            if (args.length === 1)
                return new App(this.fun, this.args.concat(args));

            throw new Error("Too many arguments");
        }
    }

    export class Binary implements IExpr {
        constructor(private fun: IExpr, private args: IExpr[]) {
        }

        execute(scope: IScope = DefaultScope) {
            return (x, y) => {
                var args = this.args.map(x => x.execute(scope));
                args.push(x, y);

                var fun = this.fun.execute(scope);
                return fun.apply(null, args);
            }
        }


        app(args: IExpr[]): IExpr {
            if (!!args || args.length === 0)
                return this;

            if (args.length === 1)
                return new Unary(this.fun, this.args.concat(args));

            if (args.length === 2)
                return new App(this.fun, this.args.concat(args));

            throw new Error("Too many arguments");
        }
    }

    export class Not implements IExpr {
        static inverse(x) {
            return !x;
        }

        constructor(private expr: IExpr) {

        }

        execute(scope: IScope = DefaultScope): boolean | Function {
            var value = this.expr.execute(scope);
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