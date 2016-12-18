module Xania {
    export module Data {

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
                // this.context = context === undefined ? this.context : context;

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

    }
    export module Bind {

        class Binding implements Data.ISubscriber {
            public state;
            protected context;
            private subscriptions = [];
            public dom;

            update(context) {
                this.context = context;
                var binding = this as any;

                return ready(binding.state,
                    s => {
                        return binding.state = binding.render(context, s);
                    });
            }

            get(obj: Data.IValue, name: string): any {
                var result = obj.get(name);
                if (!!result && !!result.subscribe) {
                    var subscription = result.subscribe(this);
                    this.subscriptions.push(subscription);
                }

                return result;
            }

            extend(context, varName: string, x: any) {
                return new Data.Extension(context, varName, x);
            }

            invoke(root, invocable, args: any[]) {

                var runtime = {
                    binding: this,
                    get(target, name) {
                        var result = target.get(name);
                        if (!!result && !!result.subscribe)
                            result.subscribe(this.binding);

                        var value = result.valueOf();
                        var type = typeof value;
                        if (value === null ||
                            type === "function" ||
                            type === "undefined" ||
                            type === "boolean" ||
                            type === "number" ||
                            type === "string")
                            return value;

                        return result;
                    },
                    set(target, name, value) {
                        target.set(name, value.valueOf());
                    },
                    invoke(target, fn) {
                        return fn.apply(target.value);
                    }
                };
                var zone = new Zone(runtime);

                var arr = args.map(result => {
                    var type = typeof result.value;
                    if (result.value === null ||
                        type === "function" ||
                        type === "boolean" ||
                        type === "number" ||
                        type === "string")
                        return result.value;

                    return result;
                });
                var result = zone.run(invocable, null, arr);

                if (!!result && result.subscribe) {
                    return result;
                }

                return new Data.Immutable(result);
            }

            forEach(context, fn) {
                if (!!context.get)
                    context.get("length").subscribe(this);
                return context.forEach(fn);
            }

            notify() {
                this.update(this.context);
            }
        }

        export class ContentBinding extends Binding {

            constructor() {
                super();
                this.dom = document.createDocumentFragment();
            }

            render() {
                return this.dom;
            }
        }

        export class TextBinding extends Binding {

            constructor(private modelAccessor, context) {
                super();
                this.dom = document.createTextNode("");
                this.context = context;
            }

            render(context) {
                const newValue = this.modelAccessor.execute(context, this).valueOf();
                this.setText(newValue);
            }

            setText(newValue) {
                this.dom.textContent = newValue;
            }

        }

        export class TagBinding extends Binding {
            protected attrs = {};
            private mutationId;
            constructor(name: string, private attributes: { name: string; tpl }[], private events: Map<string, any>) {
                super();
                this.dom = document.createElement(name);
                this.dom.attributes["__binding"] = this;
            }

            render(context) {
                const binding = this;

                this.executeAttributes(this.attributes, context, this,
                    function executeAttribute(attrName: string, newValue) {
                        if (binding.attrs[attrName] === newValue)
                            return;
                        var oldValue = binding.attrs[attrName];

                        var dom = binding.dom;
                        if (typeof newValue === "undefined" || newValue === null) {
                            dom[attrName] = undefined;
                            dom.removeAttribute(attrName);
                        } else {
                            if (typeof oldValue === "undefined") {
                                var domAttr = document.createAttribute(attrName);
                                domAttr.value = newValue;
                                dom.setAttributeNode(domAttr);
                            } else if (attrName === "class") {
                                dom.className = newValue;
                            } else {
                                dom[attrName] = newValue;
                            }
                        }
                        binding.attrs[attrName] = newValue;
                    });

                return this.dom;
            }

            private executeAttributes(attributes, context, binding, resolve) {
                var classes = [];

                const attrs = this.attributes;
                const length = attrs.length;
                for (var i = 0; i < length; i++) {
                    var { tpl, name } = attrs[i];
                    var value = tpl.execute(context, binding);

                    if (value !== null && value !== undefined && !!value.valueOf)
                        value = value.valueOf();
                    if (name === "checked") {
                        resolve(name, !!value ? "checked" : null);
                    } else if (name === "class") {
                        classes.push(value);
                    } else if (name.startsWith("class.")) {
                        if (!!value) {
                            var className = name.substr(6);
                            classes.push(className);
                        }
                    } else {
                        resolve(name, value);
                    }
                };

                resolve("class", classes.length > 0 ? join(" ", classes) : null);
            }

            trigger(name) {
                var handler = this.events.get(name);
                if (!!handler) {
                    var result = handler.execute(this.context, {
                        get(obj, name) {
                            return obj.get(name);
                        },
                        set(obj: any, name: string, value: any) {
                            obj.set(name, value);
                        },
                        invoke(_, fn, args) {
                            var xs = args.map(x => x.valueOf());
                            return fn.invoke(xs);
                        }
                    });

                    if (!!result && typeof result.value === "function")
                        result.invoke();
                }
            }
        }

        class ReactiveBinding extends Binding {
            private bindings = [];
            private stream;
            private length;

            constructor(private tpl: Dom.IDomTemplate, private target, private offset) {
                super();
            }

            render(context) {
                var { bindings, target, tpl } = this;
                if (!!tpl.modelAccessor) {
                    var stream = tpl.modelAccessor.execute(context, this);
                    this.length = 0;

                    stream.forEach((ctx, idx) => {
                        this.length = idx + 1;
                        for (var i = 0; i < bindings.length; i++) {
                            var binding = bindings[i];
                            if (binding.context.value === ctx.value) {
                                if (i !== idx) {
                                    bindings[i] = bindings[idx];
                                    bindings[idx] = binding;
                                }
                                return;
                            }
                        }
                        this.execute(ctx, idx);
                    });
                } else {
                    this.execute(context, 0);
                    this.length = 1;
                }

                while (bindings.length > this.length) {
                    const oldBinding = bindings.pop();
                    target.removeChild(oldBinding.dom);
                }

                return this;
            }

            execute(result, idx) {
                this.addBinding(this.tpl.bind(result), idx);
            }

            addBinding(newBinding, idx) {
                var { offset, target, bindings } = this;
                var insertAt = offset + idx;

                if (insertAt < target.childNodes.length) {
                    var beforeElement = target.childNodes[insertAt];
                    target.insertBefore(newBinding.dom, beforeElement);
                } else {
                    target.appendChild(newBinding.dom);
                }

                bindings.splice(idx, 0, newBinding);
            }
        }

        export function executeTemplate(observable, tpl: Dom.IDomTemplate, target, offset) {
            return new ReactiveBinding(tpl, target, offset).update(observable);
        }
    }

    export function ready(data, resolve) {

        if (data !== null && data !== undefined && !!data.then)
            return data.then(resolve);

        if (!!resolve.execute)
            return resolve.execute.call(resolve, data);

        return resolve.call(resolve, data);
    }

    export function join(separator: string, value) {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.sort().join(separator) : null;
        }
        return value;
    }

    // ReSharper restore InconsistentNaming
}
