﻿export module Expression {
    var undefined = void 0;

    export function build(ast: any): IExpr {
        if (ast === null || ast === undefined)
            return null;

        if (ast.type === undefined)
            return ast;

        switch (ast.type) {
            case "where":
                return new Where(build(ast.source), build(ast.predicate));
            case "query":
                return new Query(ast.param, build(ast.source));
            case "ident":
                return new Ident(ast.name);
            case "member":
                return new Member(build(ast.target), build(ast.member));
            case "app":
                return new App(build(ast.fun), ast.args.map(build));
            case "select":
                return new Select(build(ast.source), build(ast.selector));
            case "const":
                return new Const(build(ast.value));
            default:
                console.log(ast);
                throw new Error("not supported type " + ast.type);
        }
    }

    export interface IScope {
        get(name: string): any;
        extend?(value): IScope;
    }

    export class Scope implements IScope {
        constructor(private value: any = {}, private parent: IScope = DefaultScope) {
        }

        valueOf() {
            return this.value;
        }

        map(fn) {
            return this.value.map(fn);
        }

        extend(value: any) {
            return new Scope(value, this);
        }

        set(name: string, value: any) {
            if (value === undefined) {
                throw new Error("value is undefined");
            }

            if (this.get(name) !== undefined) {
                throw new Error("modifying value is not permitted.");
            }

            this.value[name] = value;
            return this;
        }

        get(name: string) {
            // current scope
            var value = this.value[name];

            if (typeof value === "undefined")
                return this.parent.get(name);

            if (value === null || value instanceof Date)
                return value;

            if (typeof value === "function")
                return value.bind(this.value);

            if (typeof value === "object")
                return new Scope(value, this);

            return value;
        }

        toJSON() {
            var parent: any = this.parent;
            return (<any>Object).assign({}, this.value, parent.toJSON ? parent.toJSON() : {});
        }

        toString() {
            return JSON.stringify(this.toJSON(), null, 4);
        }
    }

    interface IExpr {
        execute(scope: IScope);

        app?(args: IExpr[]): IExpr;
    }

    class DefaultScope {
        static get(name: string) {
            return window[name];
        }
        static extend(value: any): IScope {
            return new Scope(value);
        }
    }

    export class Ident implements IExpr {
        constructor(public name: string) {
            if (typeof name !== "string" || name.length === 0) {
                throw Error("Argument name is null or empty");
            }
        }

        execute(scope: IScope) {
            return scope.get(this.name);
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
            var obj = this.target.execute(scope) as IScope;

            if (typeof this.member === "string")
                return obj.get(this.member as string);

            return (this.member as IExpr).execute(obj);
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

                var childScope = new Scope({}, scope);

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

    interface IQuery extends IExpr {
        execute(scope: IScope): { map, filter, sort, forEach };
    }

    export class Select implements IExpr {
        constructor(private query: IQuery, private selector: IExpr) {
        }

        execute(scope: IScope = DefaultScope) {
            return this.query.execute(scope).map(s => this.selector.execute(s));
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
            return this.query.execute(scope).filter(scope => {
                return this.predicate.execute(scope);
            });
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
        constructor(private itemName: string, private sourceExpr: IExpr) {
            if (typeof itemName !== "string" || itemName.length === 0) {
                throw new Error("itemName is null");
            }
        }

        execute(scope: IScope = DefaultScope): Array<IScope> {
            var source = this.sourceExpr.execute(scope);
            return source.map(item => {
                var child = {};
                child[this.itemName] = item;
                return scope.extend(child);
            });
        }

        toString() {
            return `for ${this.itemName} in ${this.sourceExpr} do`;
        }
    }

    export class App implements IExpr {
        constructor(public fun: IExpr, public args: IExpr[] = []) { }

        execute(scope: IScope = DefaultScope) {
            var args = this.args.map(x => x.execute(scope).valueOf());

            if (<any>this.fun === "+") {
                return args[0] + args[1];
            }

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