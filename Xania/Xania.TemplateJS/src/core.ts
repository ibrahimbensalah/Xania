module Xania {

    export class RootContainer implements IValue {
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
            this.update();
        }

        subscribe(subscr: ISubscriber) { throw new Error("Not implemented"); }

        invoke(args: any[]) { throw new Error("Not implemented"); }

        update() {
            for (let i = 0; i < this.properties.length; i++) {
                const property = this.properties[i];

                RootContainer.updateValue(property.value, this.value);
            }
        }

        static updateValue(rootValue, rootContext) {
            let length, stack: any[] = [rootValue];

            var dirty = new Set<ISubscriber>();

            while (stack.length > 0) {
                var value = stack.pop();

                if (value.update()) {
                    if (value.value === undefined) {
                        var parent = value.parent;
                        parent.properties.splice(parent.properties.indexOf(value), 1);
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

        private extensions: { name; id; container }[] = [];
        extend2(name, value) {
            for (var i = 0; i < this.extensions.length; i++) {
                var ext = this.extensions[i];
                if (ext.name === name && ext.id === value.id)
                    return ext.container;
            }

            var container = new Extension(this, name, value);
            // this.extensions.push({ name, id: value.id, container });
            return container;
        }
    }

    interface IPromise {
        then(resolve, ...args);
    }

    interface IDomTemplate {
        bind(context): Binding;
        modelAccessor;
        children();
    }

    export class TextTemplate implements IDomTemplate {
        modelAccessor;
        constructor(private tpl) {
        }
        execute(context, binding: TextBinding) {
            return this.tpl.execute(context, binding);
        }
        bind() {
            return new TextBinding(this);
        }
        toString() {
            return this.tpl.toString();
        }
        children() {
            return [];
        }
    }

    export class ContentTemplate implements IDomTemplate {
        // ReSharper disable once InconsistentNaming
        private _children: IDomTemplate[] = [];
        public modelAccessor: Function;// = Xania.identity;

        bind(): Binding {
            return new ContentBinding(this);
        }

        public children() {
            return this._children;
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }
    }

    export class TagTemplate implements IDomTemplate {
        private attributes: { name: string; tpl }[] = [];
        private events = new Map<string, any>();
        // ReSharper disable once InconsistentNaming
        private _children: IDomTemplate[] = [];
        public modelAccessor: Function;// = Xania.identity;

        constructor(public name: string) {
        }

        public children() {
            return this._children;
        }

        public attr(name: string, tpl: any) {
            return this.addAttribute(name, tpl);
        }

        public addAttribute(name: string, tpl: any) {
            var attr = this.getAttribute(name);
            if (!attr)
                this.attributes.push({ name: name.toLowerCase(), tpl });
            return this;
        }

        public getAttribute(name: string) {
            var key = name.toLowerCase();
            for (var i = 0; i < this.attributes.length; i++) {
                var attr = this.attributes[i];
                if (attr.name === key)
                    return attr;
            }
            return null;
        }

        getEvent(name) {
            return this.events.get(name);
        }

        public addEvent(name, callback) {
            this.events.set(name, callback);
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }

        public bind() {
            return new TagBinding(this);
        }

        public select(modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        }

        public dataMutationId;

        public executeAttributes(context, binding, resolve) {
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

            resolve("class", classes.length > 0 ? Util.join(" ", classes) : null);
        }

        public executeEvents(context) {
            var result: any = {}, self = this;

            if (this.name.toUpperCase() === "INPUT") {
                var { tpl } = this.getAttribute("name");
                var name = tpl(context);
                result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
            }

            this.events.forEach((callback, eventName) => {
                result[eventName] = function () { callback.apply(self, [context].concat(arguments)); }
            });

            return result;
        }
    }

    interface IDependency {
        hasChanges(): boolean;
    }

    class PropertyDependency implements IDependency {
        constructor(private object: any, private property: string | number, private value: any) {
            if (!!value.id) {
                throw new Error();
            }
        }

        hasChanges(): boolean {
            var curValue = this.object[this.property];
            return curValue !== this.value;
        }

        static create(object, name, value): IDependency {
            if (!!value && !!value.id)
                return new IdentifierDependency(object, name, value.id);
            else
                return new PropertyDependency(object, name, value);
        }
    }

    class IdentifierDependency implements IDependency {
        private id;

        constructor(private object: any, private property: string | number, value: any) {
            this.id = value.id;
        }

        hasChanges(): boolean {
            var curValue = this.object[this.property];
            return curValue === null || curValue === undefined || curValue.id !== this.id;
        }
    }

    export class Util {

        private static lut;
        static empty = [];

        static identity(x) {
            return x;
        }

        static ready(data, resolve) {

            if (data !== null && data !== undefined && !!data.then)
                return data.then(resolve);

            if (!!resolve.execute)
                return resolve.execute.call(resolve, data);

            return resolve.call(resolve, data);
        }

        static map(fn: Function, data: any) {
            if (data === null || data === undefined) {
                return Util.empty;
            } else if (typeof data.then === "function") {
                return data.then(function dataThenBoundFn(arr) {
                    return Util.map(fn, arr);
                });
            } else if (typeof data.map === "function") {
                data.map(fn);
            } else if (Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    fn.call(this, data[i], i, data);
                }
            } else {
                fn.call(this, data, 0, [data]);
            }
            // ReSharper disable once NotAllPathsReturnValue
        }

        static collect(fn: Function, data: any) {
            if (Array.isArray(data)) {
                var result = [];
                for (let i = 0; i < data.length; i++) {
                    var items = fn.call(this, data[i]);
                    Array.prototype.push.apply(result, items);
                }
                return result;
            } else {
                return [fn.call(this, data)];
            }
        }

        static count(data) {
            if (data === null || typeof data === "undefined")
                return 0;
            return !!data.length ? data.length : 1;
        }

        static compose(...fns: any[]): Function {
            return input => {
                var result = input;
                for (var i = fns.length - 1; i > -1; i--) {
                    var fn = fns[i];
                    result = Util.execute(fn, result);
                }
                return result;
            };
        }

        static execute(fn, arg) {
            if (typeof fn.execute === "function")
                return fn.execute(arg);
            else if (typeof fn.call === "function")
                return fn.call(null, arg);
            else if (typeof fn.apply === "function")
                return fn.apply(null, [arg]);
            else
                throw new Error("not a function");
        }

        static callable(fn) {
            if (fn === null || fn === undefined)
                return false;
            return typeof fn === "function" ||
                typeof fn.execute === "function" ||
                typeof fn.apply === "function" ||
                typeof fn.call === "function";
        }

        static partialFunc() {
            const self = (<any>this);
            var args = new Array(self.baseArgs.length + arguments.length);
            for (var i = 0; i < self.baseArgs.length; i++)
                args[i] = self.baseArgs[i];
            for (var n = 0; n < arguments.length; n++) {
                args[n + self.baseArgs.length] = arguments[n];
            }
            return self.func.apply(self.context, args);
        }

        static partialApp(func, ...baseArgs: any[]) {
            return Util.partialFunc.bind({ context: this, func, baseArgs });
        }

        static join(separator: string, value) {
            if (Array.isArray(value)) {
                return value.length > 0 ? value.sort().join(separator) : null;
            }
            return value;
        }

        static id(object) {
            if (object === null || object === undefined)
                return object;

            const id = object['id'];
            if (id === undefined)
                return object;

            return id;
        }
    }

    class Router {

        private currentAction = null;

        action(name: string) {
            if (name === null || typeof name === "undefined")
                return this.currentAction;

            return this.currentAction = name;
        }
    }

    class Binding implements ISubscriber {
        public state;
        protected context;
        private subscriptions = [];

        update(context) {
            this.context = context;
            var binding = this as any;

            return Util.ready(binding.state,
                s => {
                    return binding.state = binding.render(context, s);
                });
        }
        get(obj: IValue, name: string): any {
            var result = obj.get(name);
            if (!!result && !!result.subscribe) {
                var subscription = result.subscribe(this);
                this.subscriptions.push(subscription);
            }

            return result;
        }
        extend(context, varName: string, x: any) {
            return context.extend2(varName, x);
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
                    target.set(name, value);
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

            return new Immutable(result);
        }
        forEach(context, fn) {
            return context.forEach(fn);
        }

        notify() {
            this.update(this.context);
        }

        trigger(name) {
        }
    }

    interface ISubscriber {
        notify(context?);
    }

    class ContentBinding extends Binding {
        private dom;

        constructor(private tpl: ContentTemplate) {
            super();
            this.dom = document.createDocumentFragment();
        }

        render() {
            return this.dom;
        }
    }

    class TextBinding extends Binding {
        private dom;

        constructor(private tpl: TextTemplate) {
            super();
            this.dom = document.createTextNode("");
        }

        render(context) {
            const newValue = this.tpl.execute(context, this).valueOf();
            this.setText(newValue);
        }

        setText(newValue) {
            this.dom.textContent = newValue;
        }

    }

    class TagBinding extends Binding {
        protected dom: HTMLElement;
        protected attrs = {};
        private mutationId;

        constructor(private tpl: TagTemplate) {
            super();
            this.dom = document.createElement(tpl.name);
            this.dom.attributes["__binding"] = this;
        }

        render(context) {
            const tpl = this.tpl;
            const binding = this;

            tpl.executeAttributes(context, this, function executeAttribute(attrName: string, newValue) {
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

        trigger(name) {
            var handler = this.tpl.getEvent(name);
            if (!!handler) {
                var result = handler.execute(this.context, {
                    get(value, name) {
                        return value.get(name);
                    }, 
                    invoke(_, fn, args) {
                        var xs = args.map(x => x.valueOf());
                        fn.invoke(xs);
                    }
                });

                if (!!result && typeof result.value === "function")
                    result.invoke();
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

    class Immutable implements IValue {
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
            var result = (value instanceof Property) ? value: new Property(this, name);
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
    export interface IValue {
        get(idx): IValue;
        valueOf(): any;
        subscribe(subscr: ISubscriber);
        invoke(args: any[]);
        update(context: any);
    }

    interface IValueProvider {
        get(name: string | number): IValue;
    }

    class Extension implements IValueProvider {
        constructor(private parent: IValueProvider, private name, private value) {

        }

        // private extensions: { name; id; container }[] = [];
        extend2(name, value) {
            //for (var i = 0; i < this.extensions.length; i++) {
            //    var ext = this.extensions[i];
            //    if (ext.name === name && ext.id === value.id)
            //        return ext.container;
            //}

            var container = new Extension(this, name, value);
            return container;
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

        update() {
            var value = this.value;
            RootContainer.updateValue(value, value.context);
            //var map = this.map;
            //for (var k in map) {
            //    if (map.hasOwnProperty(k)) {
            //        RootContainer.updateValue(map[k], map[k].context);
            //    }
            //}
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

        set(name, value) {
            this.value[name] = value;
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

        //map(fn) {
        //    var result = [];
        //    for (var i = 0; i < this.value.length; i++) {
        //        var item = this.get(i);
        //        result.push(fn(item));
        //    }

        //    return Sequence.create(result);
        //}
    }

    class ReactiveBinding extends Binding {
        private bindings = [];
        private stream;
        private length;


        constructor(private tpl, private target, private offset) {
            super();
        }

        render(context) {
            var { bindings, target, tpl } = this;
            if (!!this.tpl.modelAccessor) {
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
            var { offset, tpl, target, bindings } = this;
            var insertAt = offset + idx;

            const newBinding = tpl.bind();

            tpl.children()
                .reduce(Binder.reduceChild,
                { context: result, offset: 0, parentBinding: newBinding });

            newBinding.update(result);

            if (insertAt < target.childNodes.length) {
                var beforeElement = target.childNodes[insertAt];
                target.insertBefore(newBinding.dom, beforeElement);
            } else {
                target.appendChild(newBinding.dom);
            }

            bindings.splice(idx, 0, newBinding);
        }
    }

    export class Binder {
        private context: RootContainer;

        static reduceChild(prev, cur) {
            var parentBinding = prev.parentBinding;
            var context = prev.context;

            prev.offset = Util.ready(prev.offset,
                p => {
                    var state = Binder.executeTemplate(context, cur, parentBinding.dom, p);
                    return Util.ready(state, x => { return p + x.bindings.length });
                });

            return prev;
        }

        static find(selector) {
            if (typeof selector === "string")
                return document.querySelector(selector);
            return selector;
        }

        static executeTemplate(observable, tpl, target, offset) {
            var binding = new ReactiveBinding(tpl, target, offset);
            return binding.update(observable);
        }

    }

    // ReSharper restore InconsistentNaming
}
