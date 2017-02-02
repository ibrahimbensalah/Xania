﻿import { Core } from "./core";
import { Observables } from './observables'

export module Reactive {

    interface IExpressionParser {
        parse(expr: string): { execute(scope: { get(name: string) }) };
    }

    interface IAction {
        execute();
        notify(value: IDependency);
    }

    interface IDispatcher {
        dispatch(action: IAction);
    }

    interface IProperty {
        name: string;
        value: any;
        update(parentValue);
        get(name: string | number);
    }

    abstract class Value {
        public properties: IProperty[];
        protected extensions: { name: any, value: Extension }[];
        public value;

        constructor() {
        }


        get(propertyName: string): IProperty {
            var properties = this.properties;

            if (this.properties) {
                var length = properties.length;
                for (var i = 0; i < length; i++) {
                    if (properties[i].name === propertyName) {
                        return properties[i];
                    }
                }
            }

            var propertyValue = this.value,
                initialValue = propertyValue[propertyName];

            if (initialValue === void 0)
                return void 0;

            if (typeof initialValue === "function") {
                return initialValue.bind(propertyValue);
            }

            var property = new Property(this, propertyName);
            property[propertyName] = initialValue;
            property.value = initialValue;

            if (!properties)
                this.properties = [property];
            else
                properties.push(property);

            this[propertyName] = property;

            return property;
        }

        protected refresh() {
            if (!this.properties)
                return;

            var disposed = [];
            for (let i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                property.update(this.value);
                if (property.valueOf() === void 0) {
                    disposed.push(i);
                }
            }

            for (let i = disposed.length - 1; i >= 0; i--) {
                this.properties.splice(disposed[i], 1);
            }
        }

        extend(name: string, value: any) {
            for (var i = 0; this.extensions && i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.name === value) {
                    return x.value;
                }
            }

            var scope = new Extension(this).add(name, value);

            if (!this.extensions)
                this.extensions = [];

            this.extensions.push({ name: value, value: scope });

            return scope;
        }
    }

    interface IDependency {
        unbind(action: IAction): number | boolean;
    }

    class Property extends Value implements IDependency {
        // list of observers to be dispatched on value change
        private actions: IAction[];

        constructor(private parent: { value; get(name: string) }, public name) {
            super();
        }

        get(name: string) {
            var result = super.get(name);
            if (result !== void 0) {
                this[name] = result;
                return result;
            }

            return this.parent.get(name);
        }

        change(action: IAction): IDependency | boolean {
            if (!this.actions) {
                this.actions = [action];
                return this;
            } else if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        }

        unbind(action: IAction) {
            var actions = this.actions;
            if (!actions)
                return false;

            var idx = actions.indexOf(action);
            if (idx < 0)
                return false;

            actions.splice(idx, 1);
            return true;
        }

        set(value: any) {
            if (this.value !== value) {
                this.parent.value[this.name] = value;
                this.update(this.parent.value);
                this.refresh();
            }
        }

        update(parentValue) {
            var name = this.name,
                newValue = parentValue[name];

            if (newValue !== this.value) {
                this[name] = newValue;
                this.value = newValue;

                if (this.awaited) {
                    this.awaited.dispose();
                    delete this.awaited;
                }

                //if (this.value === void 0) {
                //    this.extensions = [];
                //    this.properties = [];
                //}

                const actions = this.actions;
                if (actions) {
                    // notify next
                    // delete this.actions;
                    var i = actions.length-1;
                    do {
                        actions[i].notify(this);
                    } while (i--);
                }
            }
        }

        valueOf() {
            return this.value;
        }

        private awaited: Awaited;
        await() {
            if (!this.awaited) {
                this.awaited = new Awaited(this);
            }
            return this.awaited;
        }
    }

    class Awaited {
        private subscription;
        private actions: IAction[];
        private current;

        constructor(private property: Property) {
            this.subscription = property.value.subscribe(this);
            this.current = property.value.current;
        }

        onNext(newValue) {
            if (this.current !== newValue) {
                this.current = newValue;
                if (this.actions) {
                    // notify next
                    var actions = this.actions.slice(0);
                    for (var i = 0; i < actions.length; i++) {
                        actions[i].notify(this);
                    }
                }
            }
        }

        change(action: IAction): IDependency | boolean {
            if (!this.actions) {
                this.actions = [action];
                return this;
            } else if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        }

        unbind(action: IAction) {
            if (!this.actions)
                return false;

            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;

            this.actions.splice(idx, 1);
            return true;
        }

        dispose() {
            this.subscription.dispose();
        }

        valueOf() {
            return this.current;
        }
    }

    export class Extension {

        protected extensions: { name: any, value: Extension }[];

        constructor(private parent?: { get(name: string); }) {
        }

        add(name: string, value: Value): this {
            this[name] = value;
            return this;
        }

        extend(name: string, value: any) {
            if (this.extensions) {
                for (var i = 0; i < this.extensions.length; i++) {
                    var x = this.extensions[i];
                    if (x.name === value) {
                        return x.value;
                    }
                }
            } else {
                this.extensions = [];
            }

            var scope = new Extension(this).add(name, value);

            this.extensions.push({ name: value, value: scope });

            return scope;
        }

        get(name: string) {
            var value = this[name];

            if (value === null)
                return null;

            if (value === void 0) {
                if (this.parent)
                    return this.parent.get(name);

                return value;
            }

            if (value.valueOf() === void 0)
                return void 0;

            return value;
        }
    }

    class DefaultDispatcher {
        static dispatch(action: IAction) {
            action.execute();
        }
    }

    export class Store extends Value {
        constructor(value: any, private globals: any = {}) {
            super();
            this.value = value;
        }

        get(name: string) {
            var value = super.get(name);

            if (value !== void 0) {
                return value;
            }

            var statiq = this.value.constructor && this.value.constructor[name];
            if (typeof statiq === "function")
                return statiq.bind(this.value.constructor);

            if (statiq !== void 0) {
                return statiq;
            }

            for (var i = 0; i < this.globals.length; i++) {
                var g = this.globals[i][name];
                if (g !== void 0)
                    return g;
            }

            return void 0;
        }

        update() {
            var stack: { properties, value }[] = [this];

            while (stack.length > 0) {
                var p = stack.pop();

                if (p.properties) {
                    var properties = p.properties;
                    var length = properties.length;
                    var value = p.value;
                    for (var i = 0; i < length; i++) {
                        var child = properties[i];
                        child.update(value);
                        stack.push(child);
                    }
                }
            }
        }

        toString() {
            return JSON.stringify(this.value, null, 4);
        }
    }

    export abstract class Binding {
        protected context;

        constructor(private dispatcher: IDispatcher = DefaultDispatcher) { }

        execute() {
            this.render(this.context);
        }

        notify(v: IDependency) {
            v.unbind(this);
            this.dispatcher.dispatch(this);
        }

        update(context) {
            if (this.context !== context) {
                this.context = context;
                this.execute();
            }
            return this;
        }

        observe(value) {
            if (value && value.change) {
                value.change(this);
            }
        }

        public abstract render(context?): any;

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
            this.observe(source);

            if (source.get) {
                var length = source.get("length");
                this.observe(length);
                var result = [];
                for (var i = 0; i < length; i++) {
                    var ext = this.context.extend(param, source.get(i));
                    result.push(ext);
                }
                return result;
            } else {
                return source.map(item => {
                    return this.context.extend(param, item);
                });
            }
        }

        member(target: { get(name: string) }, name) {
            var value = target[name];
            if (value === undefined && target.get)
                value = target.get(name);
            this.observe(value);
            return value;
        }

        app(fun, args: any[]) {
            var xs = [], length = args.length;
            for (var i = 0; i < length; i++) {
                var arg = args[i];
                if (arg && arg.valueOf) {
                    var x = arg.valueOf();
                    if (x === void 0)
                        return void 0;
                    xs.push(x);
                } else {
                    xs.push(arg);
                }
            }

            if (fun === "+") {
                return xs[1] + xs[0];
            } else if (fun === "-") {
                return xs[1] - xs[0];
            } else if (fun === "*") {
                return xs[1] * xs[0];
            } else if (fun === "assign") {
                throw new Error("assignment is only allow in EventBinding");
            }

            return fun.apply(null, xs);
        }

        const(value) {
            return value;
        }

        await(observable) {
            var awaitable = observable.await();
            this.observe(awaitable);
            return awaitable;
        }

        evaluate(parts): any {
            if (parts.execute)
                return parts.execute(this, this.context);
            else
                return parts;
        }
    }
}

export default Reactive;