export module Xania {
    var undefined = void 0;

    export module Data {

        export interface ISubscription {
            dispose();
        }

        export interface IObservable<T> {
            subscriber(observer: IObserver<T>);
        }

        export interface IObserver<T> {
            onNext?(v: T);
            onDone?();
            onError?();
        }

        export interface ISubscriber {
            notify();
        }

        export interface IValue {
            get(idx): IValue;
            valueOf(): any;
            subscribe(subscr: ISubscriber);
            invoke(args: any[]);
            update(context: any);
        }

        class Subscription implements Xania.Data.ISubscription {
            constructor(private observers, private observer) {
            }

            dispose() {
                var idx = this.observers.indexOf(this.observer);
                if (idx >= 0)
                    this.observers.splice(idx, 1);
                else
                    console.warn("subscription is not found");
            }
        }

        export class Observable<T> implements Xania.Data.IObserver<T> {

            private observers: Xania.Data.IObserver<T>[] = [];
            private current: T;

            subscribe(observer: Xania.Data.IObserver<T> | Function): Xania.Data.ISubscription {
                this.observers.push(observer);
                if (this.current !== undefined) {
                    if (typeof observer === "function")
                        (<Function>observer)(this.current);
                    else
                        (<IObserver<T>>observer).onNext(this.current);
                }
                return new Subscription(this.observers, observer);
            }

            map(mapper: Function) {
                var observable = new MappedObservable<T>(mapper);
                this.subscribe(observable);
                return observable;
            }

            onNext(value: T) {
                if (this.current !== value) {
                    this.current = value;
                    if (this.current !== undefined)
                        for (var i = 0; i < this.observers.length; i++) {
                            var observer = this.observers[i];
                            if (typeof observer === "function")
                                (<Function>observer)(this.current);
                            else
                                observer.onNext(this.current);
                        }
                }
            }
        }

        class MappedObservable<T> extends Observable<T> {
            constructor(private mapper: Function) {
                super();
            }

            onNext(value: T): void {
                super.onNext(this.mapper(value));
            }
        }

        export class Timer extends Observable<number> {
            private handle;
            private currentTime = 0;

            constructor() {
                super();
                super.onNext(this.currentTime);
                this.resume();
            }

            toggle() {
                if (!!this.handle)
                    this.pause();
                else
                    this.resume();
            }

            resume(): Timer {
                if (!!this.handle) {
                    console.warn("timer is already running");
                } else {
                    var startTime = new Date().getTime() - this.currentTime;
                    this.handle = setInterval(() => {
                        var currentTime = new Date().getTime();

                        super.onNext(this.currentTime = (currentTime - startTime));
                    },
                        60);

                    return this;
                }
            }

            pause() {
                if (!!this.handle) {
                    clearInterval(this.handle);
                } else {
                    console.warn("timer is not running");
                }
                this.handle = null;

                return this;
            }
        }

        export class Store implements IValue {
            private properties: { name: string; value: IValue }[] = [];

            constructor(private value: any, private libs) {
            }

            get(name): IValue {
                for (let i = 0; i < this.properties.length; i++) {
                    const existing = this.properties[i];
                    if (existing.name === name)
                        return existing.value;
                }

                var raw = this.value[name];
                if (raw !== undefined) {
                    var instval = new Property(this, name);
                    this.properties.push({ name, value: instval });
                    return instval;
                }

                raw = this.value.constructor[name] || this.libs[name];
                if (raw === undefined)
                    throw new Error("Could not resolve " + name);


                var gv = new Global(raw);
                this.properties.push({ name, value: gv });
                return gv;
            }

            set(name, value) {
                this.value[name] = value;
            }

            subscribe(subscr: ISubscriber) { throw new Error("Not implemented"); }

            invoke(args: any[]) { throw new Error("Not implemented"); }

            update() {
                let length, stack: any[] = [];

                for (let i = 0; i < this.properties.length; i++) {
                    const property = this.properties[i];
                    stack[i] = property.value;
                }

                var dirty = new Set<ISubscriber>();

                while (stack.length > 0) {
                    var value = stack.pop();

                    if (value.update()) {
                        if (value.value === undefined) {
                            var parentProps = value.parent.properties;
                            parentProps.splice(parentProps.indexOf(value), 1);
                            continue;
                        }
                        var subscribers = value.subscribers;
                        for (var n = 0; n < subscribers.length; n++) {
                            var s = subscribers[n];
                            dirty.add(s);
                        }
                        subscribers.length = 0;
                    }

                    let properties = value.properties;
                    length = properties.length;
                    for (let i = 0; i < length; i++) {
                        const child = properties[i];
                        stack.push(child);
                    }
                }

                dirty.forEach(d => {
                    if (!!d.notify)
                        d.notify();
                });
            }

            forEach(fn) {
                fn(this, 0);
            }
        }

        export class Property implements IValue {
            private subscribers: ISubscriber[] = [];
            private properties = [];
            private value;
            private id;

            constructor(private parent: any, public name: string | number) {
                var value = parent.value[name];

                this.value = value;
                this.id = value;

                if (!!this.value && this.value.id !== undefined)
                    this.id = this.value.id;
            }

            subscribe(subscr: ISubscriber) {
                if (this.subscribers.indexOf(subscr) < 0)
                    this.subscribers.push(subscr);
            }

            update() {
                const currentValue = this.parent.value[this.name];
                if (currentValue === undefined)
                    return true;

                var currentId = currentValue;
                if (!!currentValue && currentValue.id !== undefined)
                    currentId = currentValue.id;

                if (this.id !== currentId) {
                    this.value = currentValue;
                    this.id = currentId;
                    return true;
                }

                return false;
            }

            get(name) {
                for (var i = 0; i < this.properties.length; i++) {
                    var property = this.properties[i];
                    if (property.name === name)
                        return property;
                }

                var result = new Property(this, name);
                this.properties.push(result);
                return result;
            }

            set(value) {
                this.parent.value[this.name] = value;
            }

            valueOf() {
                return this.value;
            }

            hasChanges(): boolean {
                return this.value !== this.valueOf();
            }

            invoke(args: any[]) {
                var value = this.value;
                if (value === void 0 || value === null)
                    throw new TypeError(this.name + " is not invocable");
                if (!!value.execute)
                    return value.execute.apply(value, args);
                return value.apply(this.parent.value, args);
            }

            forEach(fn) {
                for (let i = 0; i < this.value.length; i++) {
                    var value = this.get(i);
                    fn(value, i);
                }
            }
        }

        class Global implements IValue {
            private properties = [];

            constructor(private value) {
            }

            get(name): IValue {
                return this[name];
            }

            subscribe(subscr: ISubscriber) { }

            invoke(args: any[]) {
                return this.value.apply(null, args);
            }

            update(context) {
                return false;
            }

            forEach(fn) {
                return this.value.forEach(fn);
            }
        }

        interface IValueProvider {
            get(name: string | number): IValue;
        }

        export class Extension implements IValueProvider {
            constructor(private parent: IValueProvider, private name, private value) {
            }

            get(name): IValue {
                if (name === this.name)
                    return this.value;

                if (this.parent !== null)
                    return this.parent.get(name);

                return undefined;
            }

            forEach(fn) {
                fn(this, 0);
            }
        }

        export class Immutable implements IValue {
            private properties = [];

            constructor(private value) {
                if (!!value.$target)
                    throw new Error("proxy is not allowed");
            }

            update() {
                return false;
            }

            get(name): IValue {
                for (var i = 0; i < this.properties.length; i++) {
                    var property = this.properties[i];
                    if (property.name === name)
                        return property;
                }

                var value = this.value[name];
                var result = (value instanceof Property) ? value : new Property(this, name);
                this.properties.push(result);
                return result;
            }

            valueOf() {
                return this.value;
            }

            subscribe(subscr: ISubscriber) { return false; }

            invoke(args: any[]) {
                return null;
            }

            map(fn) {
                var result = [];
                for (let i = 0; i < this.value.length; i++) {
                    var value = this.get(i);
                    result.push(fn(value, i));
                }
                return result;
            }

            forEach(fn) {
                for (let i = 0; i < this.value.length; i++) {
                    var value = this.get(i);
                    fn(value, i);
                }
            }
        }

        interface IObjectStore {
            get(node: string): any;
        }

        export class ObjectContainer implements IObjectStore {
            private components = new Map<string, any>();

            get(name: string): any {

                var comp;
                if (this.components.has(name)) {
                    var decl = this.components.get(name);
                    comp = !!decl.Args
                        ? Reflect.construct(decl.Type, decl.Args)
                        : new decl.Type;
                } else {
                    comp = this.global(name);
                }

                if (!comp)
                    return false;

                return comp;
            }

            private global(name: string) {
                // ReSharper disable once MissingHasOwnPropertyInForeach
                for (let k in window) {
                    if (name.toLowerCase() === k.toLowerCase()) {
                        var v: any = window[k];
                        if (typeof v === "function")
                            // ReSharper disable once InconsistentNaming
                            return new v();
                    }
                }

                return null;
            }

            component(...args: any[]) {
                if (args.length === 1 && typeof args[0] === "function") {
                    const component = args[0];
                    if (this.register(component, null)) {
                        return (component: Function) => {
                            this.unregister(component);
                            this.register(component, args);
                        };
                    }
                }

                return (component: Function) => {
                    this.register(component, args);
                };
            }

            unregister(componentType) {
                var key = componentType.name.toLowerCase();
                var decl = componentType.get(key);
                if (decl.Type === componentType)
                    this.components.delete(key);
            }

            register(componentType, args) {
                var key = componentType.name.toLowerCase();
                if (this.components.has(key))
                    return false;

                this.components.set(key, { Type: componentType, Args: args });
                return true;
            }
        }

    }
}