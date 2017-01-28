import { Core } from "./core";
import { Observables } from './observables'

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

    interface IProperty {
        name: string;
        value: any;
        update(): boolean;
        get(name: string | number);
    }

    abstract class Value {
        public properties: IProperty[];
        protected extensions: { name: any, value: Extension }[];
        public value;

        constructor(public dispatcher: IDispatcher) {
        }

        get(propertyName: string): IProperty {
            for (var i = 0; this.properties && i < this.properties.length; i++) {
                if (this.properties[i].name === propertyName) {
                    return this.properties[i];
                }
            }

            var initialValue = this.value[propertyName];

            if (initialValue === void 0)
                return void 0;

            if (typeof initialValue === "function") {
                return initialValue.bind(this.value);
            }

            var property = new Property(this.dispatcher, this, propertyName);
            property.update();

            if (!this.properties)
                this.properties = [];
            this.properties.push(property);

            return property;
        }

        protected refresh() {
            if (!this.properties)
                return;

            var disposed = [];
            for (let i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                property.update();
                if (typeof property.valueOf() === "undefined") {
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

            var scope = new Extension(this.dispatcher, this).add(name, value);

            if (!this.extensions)
                this.extensions = [];

            this.extensions.push({ name: value, value: scope });

            return scope;
        }
    }

    interface IDependency<T> {
        unbind(action: T);
    }

    class Property extends Value implements IDependency<IAction> {
        // list of observers to be dispatched on value change
        public actions: IAction[];

        constructor(dispatcher: IDispatcher, private parent: { value; get(name: string) }, public name) {
            super(dispatcher);
        }

        get(name: string) {
            var result = super.get(name);
            if (typeof result !== "undefined")
                return result;

            return this.parent.get(name);
        }

        change(action: IAction): IDependency<IAction> | boolean {
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

            const idx = this.actions.indexOf(action);
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

            if (this.awaited) {
                this.awaited.dispose();
                delete this.awaited;
            }

            this.value = newValue;

            if (this.value === void 0) {
                this.extensions = [];
                this.properties = [];
            } else {
                this.refresh();
            }

            if (this.actions) {
                // notify next
                const actions = this.actions;
                delete this.actions;
                for (let i = 0; i < actions.length; i++) {
                    this.dispatcher.dispatch(actions[i]);
                }
            }

            return true;
        }

        valueOf() {
            return this.value;
        }

        toString() {
            return this.value === null || this.value === void 0 ? "null" : this.value.toString();
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
                        this.property.dispatcher.dispatch(actions[i]);
                    }
                }
            }
        }

        change(action: IAction): IDependency<IAction> | boolean {
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

        private values = {};
        protected extensions: { name: any, value: Extension }[];

        constructor(private dispatcher: IDispatcher, private parent?: { get(name: string); }) {
        }

        add(name: string, value: Value): this {
            this.values[name] = value;
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

            var scope = new Extension(this.dispatcher, this).add(name, value);

            this.extensions.push({ name: value, value: scope });

            return scope;
        }

        get(name: string) {
            var value = this.values[name];

            if (value === null)
                return null;

            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);

                return value;
            }

            if (typeof value.valueOf() === "undefined")
                return undefined;

            return value;
        }

        toString() {
            return this.values;
        }
    }

    class DefaultDispatcher {
        static dispatch(action: IAction) {
            action.execute();
        }
    }

    export class Store extends Value {
        constructor(value: any, private globals: any = {}, dispatcher: IDispatcher = DefaultDispatcher) {
            super(dispatcher);
            this.value = value;
        }

        get(name: string) {
            var value = super.get(name);

            if (typeof value !== "undefined") {
                return value;
            }

            var statiq = this.value.constructor && this.value.constructor[name];
            if (typeof statiq === "function")
                return statiq.bind(this.value.constructor);

            if (typeof statiq !== "undefined") {
                return statiq;
            }

            for (var i = 0; i < this.globals.length; i++) {
                var g = this.globals[i][name];
                if (typeof g !== "undefined")
                    return g;
            }

            return undefined;
        }

        update() {
            var stack: { properties }[] = [this];

            while (stack.length > 0) {
                var p = stack.pop();

                for (var i = 0; p.properties && i < p.properties.length; i++) {
                    var child = p.properties[i];
                    child.update();
                    stack.push(child);
                }
            }
        }

        toString() {
            return JSON.stringify(this.value, null, 4);
        }
    }

    export abstract class Binding {

        public dependencies: IDependency<IAction>[];
        protected context;

        constructor(private dispatcher: IDispatcher = DefaultDispatcher) { }

        execute() {
            this.render(this.context);
        }

        update(context) {
            if (this.context !== context) {
                this.context = context;
                if (this.dependencies) {
                    for (var i = 0; i < this.dependencies.length; i++) {
                        this.dependencies[i].unbind(this);
                    }
                    delete this.dependencies;
                }
                this.render(context);
            }
            return this;
        }

        public static observe(value, observer) {
            if (value && value.change) {
                var dependency = value.change(observer);
                if (!!dependency) {
                    if (!observer.dependencies)
                        observer.dependencies = [dependency];
                    else
                        observer.dependencies.push(dependency);
                }
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
            Binding.observe(source, this);

            if (source.get) {
                var length = source.get("length");
                Binding.observe(length, this);
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
            var value = target.get ? target.get(name) : target[name];
            Binding.observe(value, this);
            return value;
        }

        app(fun, args: any[]) {
            var xs = [];
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (arg && arg.valueOf) {
                    var x = arg.valueOf();
                    if (typeof x === "undefined")
                        return undefined;
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
            Binding.observe(awaitable, this);
            return awaitable;
        }

        evaluate(accept, parts): any {
            if (typeof parts === "object" && typeof parts.length === "number") {
                if (parts.length === 0)
                    return "";

                if (parts.length === 1)
                    return this.evaluatePart(accept, parts[0]);

                var concatenated = "";
                for (var i = 0; i < parts.length; i++) {
                    var p = this.evaluatePart(accept, parts[i]);
                    if (typeof p === "undefined")
                        return undefined;
                    var inner = p.valueOf();
                    if (inner === undefined)
                        return undefined;
                    if (inner !== null)
                        concatenated += inner;
                }
                return concatenated;
            } else {
                return this.evaluatePart(accept, parts);
            }
        }

        evaluatePart(accept, part: any) {
            if (typeof part === "string")
                return part;
            else {
                var value = accept(part, this, this.context);
                return value && value.valueOf();
            }
        }
    }

}

export default Reactive;