import { Core } from "./core";
import { Observables } from './observables'

export module Reactive {

    interface IExpressionParser {
        parse(expr: string): { execute(scope: { get(name: string) }) };
    }

    export interface IAction {
        execute();
    }

    interface IProperty {
        name: string;
        value: any;
        refresh(parentValue);
        get(name: string | number);
    }

    abstract class Value {
        public properties: IProperty[] = [];
        public variables: Variable[] = [];
        public value;

        get(propertyName: string): IProperty {
            var properties = this.properties;

            var i = properties.length;
            while (i--) {
                var prop = properties[i];
                if (prop.name === propertyName) {
                    return prop;
                }
            }

            var propertyValue = this.value,
                initialValue = propertyValue[propertyName];

            if (initialValue === void 0)
                return void 0;

            if (typeof initialValue === "function") {
                return initialValue.bind(propertyValue);
            }

            var property = Value.createProperty(this, propertyName, initialValue);
            properties.push(property);

            return property;
        }

        static createProperty(parent, name, initialValue): IProperty {
            if (Array.isArray(initialValue)) {
                const property = new ArrayProperty(parent, name);
                property.value = initialValue;
                property.length = initialValue.length;
                return property;
            } else if (initialValue && initialValue.subscribe) {
                const property = new AwaitableProperty(parent, name);
                property.value = initialValue;
                return property;
            } else {
                const property = new ObjectProperty(parent, name);
                property.value = initialValue;
                return property;
            }
        }

        toString(): string {
            var value = this.value;
            if (typeof value === "string")
                return value;
            else if (value === void 0 || value === null)
                return Core.empty;
            else
                return value.toString();
        }

        variable(name, context) {
            var { variables } = this, i = variables.length;
            while (i--) {
                var v = variables[i];
                if (v.name === name)
                    return v;
            }
            var newVar = new Variable(name, this, context);
            variables.push(newVar);
            return newVar;
        }
    }

    interface IDependency {
        unbind(action: IAction): number | boolean;
    }

    abstract class Property extends Value implements IDependency {
        // list of observers to be dispatched on value change
        private actions: IAction[];

        constructor(protected parent: Value, public name) {
            super();
        }

        get(name: string) {
            var result = super.get(name);
            if (result !== void 0) {
                return result;
            }

            return this.parent.get(name);
        }

        change(action: IAction): this | boolean {
            var actions = this.actions;
            if (actions) {
                var length = actions.length,
                    i = length;
                while (i--) {
                    if (action === actions[i])
                        return false;
                }
                actions[length] = action;
            } else {
                this.actions = [action];
            }
            return this;
        }

        unbind(action: IAction) {
            var actions = this.actions;
            if (!actions)
                return false;

            const idx = actions.indexOf(action);
            if (idx < 0)
                return false;

            actions.splice(idx, 1);
            return true;
        }

        set(value: any) {
            this.parent.value[this.name] = value;
        }

        valueOf() {
            return this.value;
        }
    }


    class ArrayProperty extends Property {

        public length = 0;

        refresh(parentValue) {
            const name = this.name,
                array = parentValue[name],
                properties = this.properties,
                prevLength = this.length,
                valueLength = array && array.length;

            this.length = valueLength;
            var changed = valueLength !== prevLength;

            if (array && properties) {
                var i = properties.length;
                while (i--) {
                    let property = properties[i];

                    var idx = array.indexOf(property.value);
                    if (idx < 0) {
                        properties.splice(i, 1);
                        changed = true;
                    } else {
                        property.name = idx;
                    }
                }
            }
            this.value = array;
            return changed;
        }

        indexOf(item) {
            return this.value.indexOf(item);
        }
    }

    class ObjectProperty extends Property {
        refresh(parentValue) {
            var name = this.name,
                newValue = parentValue[name];

            if (newValue !== this.value) {
                this.value = newValue;

                if (newValue === void 0 || newValue === null)
                    this.properties.length = 0;

                return true;
            }
            return false;
        }
    }

    class AwaitableProperty extends ObjectProperty {
        get length() {
            if (Array.isArray(this.value))
                return this.value.length;
            return 0;
        }

        refresh(parentValue) {
            if (super.refresh(parentValue)) {
                if (this.awaited) {
                    this.awaited.dispose();
                    delete this.awaited;
                }
                return true;
            }
            return false;
        }

        public awaited: AwaitedObservable;
        await() {
            if (!this.awaited) {
                this.awaited = new AwaitedObservable(this.value);
            }
            return this.awaited;
        }
    }

    abstract class Awaited {
        private actions: IAction[];

        constructor(protected current?) { }

        onNext(newValue) {
            if (this.current !== newValue) {
                this.current = newValue;
                if (this.actions) {
                    // notify next
                    var actions = this.actions.slice(0);
                    for (var i = 0; i < actions.length; i++) {
                        actions[i].execute();
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

        valueOf() {
            return this.current;
        }

        get(name: string) {
            return this.current[name];
        }

        get length() {
            if (typeof this.current === "undefined" || this.current === null)
                return 0;
            var length = this.current.length;
            return length;
        }

        indexOf(item) {
            return this.current.indexOf(item);
        }

        toString() {
            return this.current;
        }
    }

    export class AwaitedPromise extends Awaited {
        constructor(private promise) {
            super();

            promise.then(data => {
                super.onNext(data);
            });
        }
    }

    export class AwaitedObservable extends Awaited {
        private subscription;

        constructor(observable: any) {
            super(observable.valueOf());
            this.subscription = observable.subscribe(this);
        }

        dispose() {
            this.subscription.dispose();
        }
    }

    export interface IDispatcher {
        dispatch(action: IAction);
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

        refresh(mutable = true) {
            var stack: { properties, value }[] = [this];
            var stackLength: number = 1;
            var dirty: any[] = [];
            var dirtyLength: number = 0;

            while (stackLength--) {
                const parent = stack[stackLength];
                var properties = parent.properties;
                const parentValue = parent.value;
                let i: number = properties.length;
                while (i--) {
                    var child = properties[i];
                    var changed = child.refresh(parentValue);
                    if (mutable || changed) {
                        stack[stackLength++] = child;

                        if (changed === true) {
                            const actions = child.actions;
                            if (actions) {
                                dirty[dirtyLength++] = actions;
                            }
                        }
                    }
                };
            }

            var j = dirtyLength;
            while (j--) {
                var actions = dirty[j];
                // notify next
                var e = actions.length;
                while (e--) {
                    var action = actions[e];
                    action.execute();
                }
            }
        }

        toString() {
            return JSON.stringify(this.value, null, 4);
        }
    }

    class DefaultDispatcher {
        static dispatch(action: IAction) {
            action.execute();
        }
    }


    export interface IDriver {
        insert?(sender: Binding, dom, idx);
        on(eventName, dom, eventBinding);
    }

    class Variable {
        constructor(public name: string, public value: any, private parent) {
        }

        get(name) {
            if (name === this.name)
                return this.value;
            return this.parent.get(name);
        }

        refresh() {
            this.parent.refresh();
        }
    }

    export abstract class Binding {
        public context;
        public length;
        public childBindings: Binding[] = [];

        constructor(protected driver: IDriver) {
            if (!driver)
                throw new Error("Argument driver is required.");
            if (typeof driver.insert !== "function")
                throw new Error("Driver is incompatible.");
        }

        execute(): Binding[] {
            this.render(this.context, this.driver);
            return this.childBindings;
        }

        update(context): this {
            this.context = context;
            this.updateChildren(context);
            return this;
        }

        updateChildren(context) {
            var { childBindings } = this;
            if (childBindings) {
                let i = childBindings.length || 0;
                while (i--) {
                    childBindings[i].update(context);
                }
            }
        }

        observe(value) {
            if (value && value.change) {
                value.change(this);
            }
        }

        public abstract render?(context, driver): any;
        dispose() {
            var { childBindings } = this;
            if (childBindings && Array.isArray(childBindings)) {
                var i = childBindings.length || 0;
                while (i--) {
                    childBindings[i].dispose();
                }
                childBindings.length = 0;
            }
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
                var length = source.length;
                var result = [];
                if (length === void 0)
                    return result;
                var len = +length;
                for (var i = 0; i < len; i++) {
                    var ext = this.extend(param, source.get(i));
                    result.push(ext);
                }
                return result;
            } else {
                return source.map(item => {
                    return this.extend(param, item);
                });
            }
        }

        extend(name: string, value: any) {
            if (value === null || value === void 0)
                return value;

            if (value.variable)
                return value.variable(name, this.context);
            return new Variable(name, value, this.context);
        }

        member(target: { get(name: string) }, name) {
            if (target === null || target === undefined)
                return target;
            if (target.get) {
                var value = target.get(name);
                if (value && value.change)
                    value.change(this);

                return value;
            }
            return target[name];
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

        await(value) {
            if (!value.awaited) {
                var observable = value.valueOf();
                if (observable.then)
                    value.awaited = new AwaitedPromise(value);
                else if (typeof observable.subscribe === "function")
                    value.awaited = new AwaitedObservable(observable);
                else
                    return value;
            }

            this.observe(value.awaited);
            return value.awaited;
        }

        evaluateText(parts, context = this.context): any {
            if (parts.execute) {
                let result = parts.execute(this, context);
                return result && result.toString();
            } else if (Array.isArray(parts)) {
                var stack = parts.slice(0).reverse();
                let result = Core.empty;

                while (stack.length) {
                    const cur = stack.pop();
                    if (cur === void 0 || cur === null) {
                        // skip 
                    } else if (cur.execute) {
                        stack.push(cur.execute(this, context));
                    } else if (Array.isArray(cur)) {
                        var i = cur.length;
                        while (i--) {
                            stack.push(cur[i]);
                        }
                    } else {
                        result += cur;
                    }
                }

                return result;
            } else if (typeof parts === "string") {
                return parts;
            } else {
                return parts.toString();
            } 
        }

        evaluateObject(expr, context = this.context): any {
            if (!expr)
                return expr;
            else if (expr.execute)
                return expr.execute(this, context);
            else if (Array.isArray(expr)) {
                return expr.map(x => this.evaluateObject(x, context));
            }
            else
                return expr;
        }
        on(eventName, dom, eventBinding) {
            this.driver.on(eventName, dom, eventBinding);
        }
    }
}

export default Reactive;