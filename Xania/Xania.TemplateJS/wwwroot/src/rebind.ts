import { Core } from "./core";
import { Expression } from "./expression";

export module Reactive {

    interface IExpressionParser {
        parse(expr: string): { execute(scope: { get(name: string) }) };
    }

    interface IAction {
        execute();
    }

    interface IDispatcher {
        dispatch(action: IAction);
    }

    abstract class Value {
        private properties: { name: string, value: any }[] = [];

        constructor(public value) {
        }

        get(propertyName: string): { value; } {
            for (var i = 0; i < this.properties.length; i++) {
                if (this.properties[i].name === propertyName)
                    return this.properties[i];
            }

            var initialValue = this.value[propertyName];
            if (initialValue === void 0)
                return void 0;

            if (typeof initialValue === "function") {
                return initialValue.bind(this.value);
            }

            var child = this.create(propertyName, initialValue);
            child.update();
            this.properties.push(child);

            return child;
        }

        abstract create(propertyName: string, initialValue): { name: string, value, update() };
    }

    interface IDependency<T> {
        unbind(action: T);
    }

    class Property extends Value implements IDependency<IAction> {
        // list of observers to be dispatched on value change
        public actions: IAction[] = [];

        constructor(private dispatcher: IDispatcher, private parent: { value; }, public name, value) {
            super(value);
        }

        create(propertyName: string, initialValue): { name: string, value, update() } {
            return new Property(this.dispatcher, this, propertyName, initialValue);
        }

        change(action: IAction): IDependency<IAction> |  boolean {
            if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        }

        unbind(action: IAction) {
            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;

            this.actions.splice(idx, 1);
            return true;
        }

        set(value: any) {
            if (this.value !== value) {
                this.parent.value[this.name] = value;

                this.update();
            }
        }

        update() {
            var newValue = this.parent.value[this.name];
            if (newValue === this.value)
                return false;

            this.value = newValue;

            if (this.value === void 0) {
                // notify done
            } else {
                // notify next
                var actions = this.actions.slice(0);
                for (var i = 0; i < actions.length; i++) {
                    this.dispatcher.dispatch(actions[i]);
                }
            }

            return true;
        }

        valueOf() {
            return this.value;
        }
    }

    export class Scope extends Value {
        constructor(private store: Store, value: any, private parent?: { get(name: string); }) {
            super(value);
        }

        create(propertyName: string, initialValue): { name: string, value, update() } {
            return new Property(this.store, this, propertyName, initialValue);
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

        get(name: string) {
            var value = super.get(name);

            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);

                return value;
            }

            return value;
        }

        toJSON() {
            var parent: any = this.parent;
            return (<any>Object).assign({}, this.value, parent && parent.toJSON ? parent.toJSON() : {});
        }

        toString() {
            return JSON.stringify(this.toJSON(), null, 4);
        }
    }

    export class Store implements IDispatcher {
        public dirty = [];
        public root: Scope;

        constructor(value: any = {}) {
            this.root = new Scope(this, value);
        }

        dispatch(action: IAction) {
            this.dirty.push(action);
        }

        flush() {
            this.dirty.forEach(d => {
                d.execute();
            });
            this.dirty.length = 0;
        }

        get(name: string) {
            var value = this.root.get(name);

            if (typeof value === "undefined") {
                throw new Error("Cannot resolve variable " + name);
            }

            return value;
        }

        toString() {
            return JSON.stringify(this.root.toJSON(), null, 4);
        }
    }

    export class Binding {

        public dependencies: IDependency<IAction>[] = [];

        constructor(private context: { get(name: string) }, private ast: any) { }

        execute() {
            for (var i = 0; i < this.dependencies.length; i++) {
                this.dependencies[i].unbind(this);
            }
            this.dependencies.length = 0;

            var result = Expression.accept(this.ast, this).valueOf();

            console.log(result);

            return result;
        }

        get(name: string): any {
            throw new Error("Not implemented");
        }

        extend(): Core.IScope {
            throw new Error("Not implemented");
        }

        where(source, predicate) {
            throw new Error("Not implemented");
        }

        select(source, selector) {
            throw new Error("Not implemented");
        }

        query(param, source) {
            throw new Error("Not implemented");
        }

        ident(name) {
            return this.member(this.context, name);
        }

        member(target: { get(name: string) }, name) {
            var value = target.get(name);

            if (value && value.change) {
                var dependency = value.change(this);
                if (!!dependency)
                    this.dependencies.push(dependency);
            }

            return value;
        }

        app(fun, args: any[]) {
            throw new Error("Not implemented");
        }

        const(value) {
            throw new Error("Not implemented");
        }
    }

}