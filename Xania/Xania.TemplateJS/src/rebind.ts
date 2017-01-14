import { Core } from "./core";

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
        private properties: { name: string; value: any; update(): boolean }[] = [];
        private $reactive = true;

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

            if (!!initialValue && typeof initialValue.$reactive !== "undefined") {
                this.properties.push(initialValue);
                return initialValue;
            }

            var child = this.create(propertyName, initialValue);
            child.update();
            this.properties.push(child);

            return child;
        }

        protected updateProperties() {
            var properties = this.properties.slice(0);
            this.properties = [];
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                if (property.update() || typeof property.value !== "undefined") {
                    this.properties.push(property);
                }
            }
        }

        abstract create(propertyName: string, initialValue): { name: string, value, update() };

        private extensions: { key: any, value: Scope }[] = [];
        extendValue(dispatcher: IDispatcher, name: string, value: any) {
            for (var i = 0; i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.key === value) {
                    return x.value;
                }
            }

            var child = {};
            child[name] = value;
            var scope = new Scope(dispatcher, child, this);

            this.extensions.push({ key: value, value: scope });

            return scope;
        }
    }

    interface IDependency<T> {
        unbind(action: T);
    }

    class Property extends Value implements IDependency<IAction> {
        // list of observers to be dispatched on value change
        public actions: IAction[] = [];

        constructor(private dispatcher: IDispatcher, private parent: { value; get(name: string) }, public name, value) {
            super(value);
        }

        create(propertyName: string, initialValue): { name: string, value, update() } {
            return new Property(this.dispatcher, this, propertyName, initialValue);
        }

        extend(name: string, value: any) {
            return super.extendValue(this.dispatcher, name, value);
        }

        get(name: string) {
            var result = super.get(name);
            if (typeof result !== "undefined")
                return result;

            return this.parent.get(name);
        }

        change(action: IAction): IDependency<IAction> | boolean {
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
                return true;
            } else {
                // notify next
                var actions = this.actions.slice(0);
                for (var i = 0; i < actions.length; i++) {
                    this.dispatcher.dispatch(actions[i]);
                }

                super.updateProperties();
                return true;
            }
        }

        valueOf() {
            return this.value;
        }

        map(fn) {
            return this.value.map((item, idx) => fn(super.get(idx), idx));
        }

        toString() {
            return this.value === null || this.value === void 0 ? "null" : this.value.toString();
        }
    }

    export class Scope extends Value {
        constructor(private dispatcher: IDispatcher, value: any, private parent?: { get(name: string); }) {
            super(value);
        }

        create(propertyName: string, initialValue): { name: string, value, update() } {
            return new Property(this.dispatcher, this, propertyName, initialValue);
        }

        valueOf() {
            return this.value;
        }

        map(fn) {
            return this.value.map(fn);
        }

        extend(name: string, value: any) {
            return super.extendValue(this.dispatcher, name, value);
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

            if (typeof (<any>this)._json === "undefined") {
                (<any>this)._json = "*recursive*";
                (<any>this)._json = (<any>Object).assign({}, this.value, parent && parent.toJSON ? parent.toJSON() : {});
            }

            return (<any>this)._json;
        }

        toString() {
            return this.value;
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

        extend(name: string, value: any) {
            return this.root.extend(name, value);
        }

        toString() {
            return JSON.stringify(this.root.toJSON(), null, 4);
        }
    }

    export abstract class Binding {

        public dependencies: IDependency<IAction>[] = [];
        protected context;
        public state;

        execute() {
            for (var i = 0; i < this.dependencies.length; i++) {
                this.dependencies[i].unbind(this);
            }
            this.dependencies.length = 0;

            this.update(this.context);
        }

        update(context) {
            this.context = context;

            this.state = Core.ready(this.state,
                s => {
                    return this.render(context, s);
                });

            return this;
        }

        public static observe(value, observer) {
            if (value && value.change) {
                var dependency = value.change(observer);
                if (!!dependency)
                    observer.dependencies.push(dependency);
            }
        }

        public abstract render(context?, state?) : any;

        get(name: string): any {
            throw new Error("Not implemented");
        }

        extend(): any {
            throw new Error("Not implemented");
        }

        where(source, predicate) {
            throw new Error("Not implemented");
        }

        select(source, selector) {
            return source.map(selector);
        }

        query(param, source) {
            Binding.observe(source, this);
            return source.map(item => {
                return this.context.extend(param, item);
            });
        }

        member(target: { get(name: string) }, name) {
            var value = target.get(name);

            Binding.observe(value, this);

            return value;
        }


        app(fun, args: any[]) {
            if (fun === "+") {
                return args[1] + args[0];
            }

            throw new Error("Not implemented");
        }

        const(value) {
            return value;
        }
    }

}