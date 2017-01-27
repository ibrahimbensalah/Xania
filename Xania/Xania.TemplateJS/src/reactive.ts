import { Core } from "./core";
import { Observables } from './observables'

export module Reactive {

    interface IExpressionParser {
        parse(expr: string): { execute(scope: { get(name: string) }) };
    }

    interface IAction {
        execute(options?: any);
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
        protected properties: IProperty[] = [];
        protected extensions: { name: any, value: Extension }[] = [];
        public value;

        constructor(protected dispatcher: IDispatcher) {
        }

        get(propertyName: string): IProperty {
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

            var property = new Property(this.dispatcher, this, propertyName);
            property.update();
            this.properties.push(property);

            return property;
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

        extend(name: string, value: any) {
            for (var i = 0; i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.name === value) {
                    return x.value;
                }
            }

            var scope = new Extension(this.dispatcher, this).add(name, value);

            this.extensions.push({ name: value, value: scope });

            return scope;
        }
    }

    interface IDependency<T> {
        unbind(action: T);
    }

    class Property extends Value implements IDependency<IAction> {
        // list of observers to be dispatched on value change
        public actions: IAction[] = [];
        public subscribe: (v) => void;

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

            if (typeof newValue === "undefined")
                throw new Error("Undefined value is not supported");

            this.value = newValue;
            delete this.subscribe;
            if (!!newValue && newValue.subscribe) {
                this.subscribe = newValue.subscribe.bind(newValue);
            }

            if (this.value === void 0) {
                this.extensions = [];
                this.properties = [];
            } else {
                this.updateProperties();
            }

            if (this.actions) {
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

        map(fn) {
            return this.value.map((item, idx) => fn(super.get(idx), idx));
        }

        toString() {
            return this.value === null || this.value === void 0 ? "null" : this.value.toString();
        }
    }

    export class Extension {

        private values = {};
        protected extensions: { name: any, value: Extension }[] = [];

        constructor(private dispatcher: IDispatcher, private parent?: { get(name: string); }) {
        }

        add(name: string, value: Value) {
            this.values[name] = value;

            return this;
        }

        extend(name: string, value: any) {
            for (var i = 0; i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.name === value) {
                    return x.value;
                }
            }

            var scope = new Extension(this.dispatcher, this).add(name, value);

            this.extensions.push({ name: value, value: scope });

            return scope;
        }

        get(name: string) {
            var value = this.values[name];

            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);

                return value;
            }

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

    class Stream extends Value {
        private actions: IAction[] = [];
        subscription: Observables.ISubscription;

        constructor(dispatcher: IDispatcher, observable) {
            super(dispatcher);
            this.value = observable.valueOf();
            this.subscription = observable.subscribe(this);
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

        onNext(newValue) {
            if (this.value === newValue)
                return;

            this.value = newValue;

            // notify next
            var actions = this.actions.slice(0);
            for (var i = 0; i < actions.length; i++) {
                this.dispatcher.dispatch(actions[i]);
            }
        }

        valueOf() {
            return this.value;
        }
    }

    export class Store extends Value {
        private animHandler: number = 0;

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

        toString() {
            return JSON.stringify(this.value, null, 4);
        }
    }

    export abstract class Binding {

        public dependencies: IDependency<IAction>[] = [];
        protected context;

        constructor(private dispatcher: IDispatcher = DefaultDispatcher) { }

        execute(options?: any) {
            for (var i = 0; i < this.dependencies.length; i++) {
                this.dependencies[i].unbind(this);
            }
            this.dependencies.length = 0;

            this.update(this.context, options);
        }

        update(context, options?) {
            this.context = context;

            this.render(context, options);
            return this;
        }

        public static observe(value, observer) {
            if (value) {
                if (value.change) {
                    var dependency = value.change(observer);
                    if (!!dependency)
                        observer.dependencies.push(dependency);
                }
            }
        }

        public abstract render(context?, options?): any;

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
            var value = target.get ? target.get(name) : target[name];
            Binding.observe(value, this);

            if (!!value && !!value.subscribe) {
                // unwrap current value of observable
                var subscription = value.subscribe(newValue => {
                    if (newValue !== subscription.current) {
                        subscription.dispose();
                        this.dispatcher.dispatch(this);
                    }
                });

                return subscription.current;
            }

            return value;
        }


        app(fun, args: any[]) {
            if (fun === "+") {
                return args[1] + args[0];
            } else if (fun === "-") {
                return args[1] - args[0];
            } else if (fun === "*") {
                return args[1] * args[0];
            } else if (fun === "assign") {
                throw new Error("assignment is only allow in EventBinding");
                //var value = args[0].valueOf();
                //args[1].set(value);
                //return value;
            }

            return fun.apply(null, args.map(x => x.valueOf()));
        }

        const(value) {
            return value;
        }

        onNext(newValue) {
            this.execute();
        }

        evaluate(accept, parts): any {
            if (typeof parts === "object" && typeof parts.length === "number") {
                if (parts.length === 0)
                    return "";

                if (parts.length === 1)
                    return this.evaluatePart(accept, parts[0]);

                return parts.map(p => this.evaluatePart(accept, p)).join("");
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