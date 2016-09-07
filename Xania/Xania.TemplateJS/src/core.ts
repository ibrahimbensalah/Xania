/// <reference path="../scripts/typings/es6-shim/es6-shim.d.ts" />
module Xania {
    class Application {
        private components = new Map<string, any>();
        private observer = new Observer();
        private compile: Function;
        private compiler: Ast.Compiler;

        constructor(private libs: any[]) {
            this.compiler = new Ast.Compiler();
            this.compile = this.compiler.template.bind(this.compiler);
        }

        component(...dependencies) {
            return (component) => this.components.set(component.name.toLowerCase(), { Type: component, Dependencies: dependencies });
        }

        start() {
            // Find top level components and bind
            var stack: Node[] = [document.body];

            while (stack.length > 0) {
                var dom = stack.pop();

                var component = this.getComponent(dom.nodeName);
                if (component === false) {
                    for (var i = 0; i < dom.childNodes.length; i++) {
                        var child = dom.childNodes[i];
                        if (child.nodeType === 1)
                            stack.push(child);
                    }
                } else {
                    this.bind(dom.nodeName + ".html", component, dom);
                }
            }

            return this;
        }

        public listen(target) {
            var eventHandler = (target, name) => {
                var binding = target.attributes["__binding"];
                if (!!binding) {
                    var handler = binding.tpl.events.get(name);
                    if (!!handler) {
                        const observable = this.observer.track(binding.context);
                        handler(observable);
                        this.observer.update();
                    }
                }
            };

            target.addEventListener("click", evt => eventHandler(evt.target, evt.type));

            const onchange = evt => {
                var binding = evt.target.attributes["__binding"];
                if (binding != null) {
                    const nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        const proxy = this.observer.track(binding.context);
                        const prop = nameAttr.value;
                        const update = new Function("context",
                            "value",
                            `with (context) { ${prop} = value; }`);
                        update(proxy, evt.target.value);
                    }
                }
            };
            target.addEventListener("keyup",
                evt => {
                    if (evt.keyCode === 13) {
                        eventHandler(evt.target, "keyup.enter");
                    } else {
                        onchange(evt);
                    }
                    this.observer.update();
                });
        }

        public update() {
            this.observer.update();
        }

        public track(object) {
            return this.observer.track(object);
        }

        getComponent(nodeName: string) {
            var name = nodeName.replace(/\-/, "").toLowerCase();
            if (!this.components.has(name)) {
                return false;
            }
            var cmp = this.components.get(name);
            return Reflect.construct(cmp.Type, cmp.Dependencies);
        }

        import(view, ...args): IPromise | IDomTemplate {
            if (typeof view === "string") {
                if (!("import" in document.createElement("link"))) {
                    throw new Error("HTML import is not supported in this browser");
                }

                return {
                    then(resolve) {
                        var link = document.createElement('link');
                        link.rel = 'import';
                        link.href = view;
                        link.setAttribute('async', ""); // make it async!
                        link.onload = e => {
                            var link = (<any>e.target);
                            var dom = link.import.querySelector("template");
                            resolve.apply(this, [dom].concat(args));
                        }
                        document.head.appendChild(link);
                    }
                };
            } else if (view instanceof HTMLElement) {
                return view;
            } else {
                throw new Error("view type is not supported");
            }
        }

        // ReSharper disable once InconsistentNaming
        bind(view, component, target: Node) {
            var binder = new Binder(component, this.libs, this.observer);

            Util.ready(this.import(view),
                dom => {
                    var tpl = this.parseDom(dom);
                    binder.subscribe(null, tpl, target);
                });

            return this;
        }

        parseDom(rootDom: HTMLElement): TagTemplate {
            const stack = [];
            let i: number;
            var rootTpl;
            stack.push({
                node: rootDom,
                push(e) {
                    rootTpl = e;
                }
            });

            while (stack.length > 0) {
                const cur = stack.pop();
                const node: Node = cur.node;
                const push = cur.push;

                if (!!node["content"]) {
                    const content = <HTMLElement>node["content"];
                    var template = new ContentTemplate();
                    for (i = content.childNodes.length - 1; i >= 0; i--) {
                        stack.push({ node: content.childNodes[i], push: template.addChild.bind(template) });
                    }
                    push(template);
                } else if (node.nodeType === 1) {
                    const elt = <HTMLElement>node;
                    const template = new TagTemplate(elt.tagName);

                    for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                        var attribute = elt.attributes[i];
                        this.parseAttr(template, attribute);
                    }

                    for (i = elt.childNodes.length - 1; i >= 0; i--) {
                        stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                    }
                    push(template);
                } else if (node.nodeType === 3) {
                    var textContent = node.textContent;
                    if (textContent.trim().length > 0) {
                        const tpl = this.compile(textContent);
                        push(new TextTemplate(tpl || node.textContent));
                    }
                }
            }

            return rootTpl;
        }

        parseAttr(tagElement: TagTemplate, attr: Attr) {
            const name = attr.name;
            if (name === "click" || name.match(/keyup\./)) {
                const fn = this.compile(attr.value);
                tagElement.addEvent(name, fn);
            } else if (name === "data-select" || name === "data-from") {
                const fn = this.compile(attr.value);
                tagElement.select(fn);
            } else if (name === "checked") {
                const fn = this.compile(attr.value);
                tagElement.attr(name, Util.compose(ctx => !!ctx ? "checked" : null, fn));
            } else {
                const tpl = this.compile(attr.value);
                tagElement.attr(name, tpl || attr.value);

                // conventions
                if (!!tagElement.name.match(/^input$/i) &&
                    !!attr.name.match(/^name$/i) &&
                    !tagElement.hasAttribute("value")) {
                    const valueAccessor = this.compile(`{{ ${attr.value} }}`);
                    tagElement.attr("value", valueAccessor);
                }
            }
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

    class TextTemplate implements IDomTemplate {
        modelAccessor;
        constructor(private tpl) {
        }
        execute(context) {
            return this.tpl.execute(context);
        }
        bind(context) {
            return new TextBinding(this, context);
        }
        toString() {
            return this.tpl.toString();
        }
        children() {
            return [];
        }
    }

    class ContentTemplate implements IDomTemplate {
        // ReSharper disable once InconsistentNaming
        private _children: IDomTemplate[] = [];
        public modelAccessor: Function;// = Xania.identity;

        bind(context): Binding {
            return new ContentBinding(this, context);
        }

        public children() {
            return this._children;
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }
    }

    class TagTemplate implements IDomTemplate {
        private attributes = new Map<string, any>();
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
            this.attributes.set(name.toLowerCase(), tpl);
            return this;
        }

        public hasAttribute(name: string) {
            var key = name.toLowerCase();
            return this.attributes.has(key);
        }

        public addEvent(name, callback) {
            this.events.set(name, callback);
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }

        public bind(context) {
            return new TagBinding(this, context);
        }

        public select(modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        }

        public executeAttributes(context, dom, resolve) {
            var classes = [];

            this.attributes.forEach(function attributesForEachBoundFn(tpl, name) {
                var value = tpl.execute(context).valueOf();
                if (name === "class") {
                    classes.push(value);
                } else if (name.startsWith("class.")) {
                    if (!!value) {
                        var className = name.substr(6);
                        classes.push(className);
                    }
                } else {
                    resolve(name, value, dom);
                }
            });

            // if (classes.length > 0)
            resolve("class", Util.join(" ", classes), dom);
        }

        public executeEvents(context) {
            var result: any = {}, self = this;

            if (this.name.toUpperCase() === "INPUT") {
                var name = this.attributes.get("name")(context);
                result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
            }

            this.events.forEach((callback, eventName) => {
                result[eventName] = function () { callback.apply(self, [context].concat(arguments)); }
            });

            return result;
        }

    }

    interface IObserver {
        addDependency(obj: any, prop: string, value: any);
        setChange(obj: any, prop: any);
    }

    class Util {

        private static lut;
        static empty = [];

        static identity(x) {
            return x;
        }

        static ready(data, resolve) {

            if (data !== null && data !== undefined && typeof (data.then) === "function")
                return data.then(resolve);

            if (typeof (resolve.execute) === "function")
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
            return function (result) {
                for (var i = fns.length - 1; i > -1; i--) {
                    // ReSharper disable once SuspiciousThisUsage
                    result = fns[i].call(this, result);
                }
                return result;
            };
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

        static observe(target, observer: IObserver) {
            // ReSharper disable once InconsistentNaming
            if (!target)
                return target;

            if (target.isSpy) {
                if (target.$observer === observer)
                    return target;
                target = target.valueOf();
            }

            if (typeof target === "object") {
                return Array.isArray(target)
                    ? Util.observeArray(target, observer)
                    : Util.observeObject(target, observer);
            } else {
                return target;
            }
        }

        static observeArray(arr, observer: IObserver) {
            // ReSharper disable once InconsistentNaming
            return Util.proxy(arr,
                {
                    get(target, property) {
                        switch (property) {
                            case "$id":
                                return arr;
                            case "$observer":
                                return observer;
                            case "isSpy":
                                return true;
                            case "valueOf":
                                return arr.valueOf.bind(arr);
                            case "indexOf":
                                observer.addDependency(arr, "length", arr.length);
                                return (item) => {
                                    for (var i = 0; i < arr.length; i++) {
                                        if (Util.id(item) === Util.id(arr[i]))
                                            return i;
                                    }
                                    return -1;
                                }
                            case "length":
                                observer.addDependency(arr, "length", arr.length);
                                return arr.length;
                            case "constructor":
                                return Array;
                            case "concat":
                                return (append) => {
                                    // observer.setRead(arr, "length");
                                    // observer.setRead(Xania.id(append), "length");
                                    return arr.concat(append);
                                };
                            case "splice":
                            case "some":
                            case "every":
                            case "slice":
                            case "filter":
                            case "map":
                            case "pop":
                            case "push":
                                observer.addDependency(arr, "length", arr.length);
                                return Util.observeProperty(arr, property, arr[property], observer);
                            default:
                                if (arr.hasOwnProperty(property))
                                    return Util.observeProperty(arr, property, arr[property], observer);
                                return undefined;
                        }
                    },
                    set(target, property, value) {
                        if (Util.id(arr[property]) !== Util.id(value)) {
                            var length = arr.length;

                            arr[property] = value;
                            observer.setChange(Util.id(arr), property);

                            if (arr.length !== length)
                                observer.setChange(Util.id(arr), "length");
                        }

                        return true;
                    }
                });
        }

        static observeObject(object, observer: IObserver) {
            return Util.proxy(object,
                {
                    get(target, property) {
                        switch (property) {
                            case "$id":
                                return object;
                            case "$observer":
                                return observer;
                            case "isSpy":
                                return true;
                            case "valueOf":
                                return () => object;
                            case "constructor":
                                return object.constructor;
                            default:
                                // ReSharper disable once SuspiciousThisUsage
                                return Util.observeProperty(object, property, object[property], observer);
                        }
                    },
                    set(target, property, value) {
                        if (Util.id(object[property]) !== Util.id(value)) {
                            object[property] = value;
                            observer.setChange(Util.id(object), property);
                        }

                        return true;
                    }
                });
        }

        static observeFunction(object, func, observer, args) {
            var retval = func.apply(object, args);

            return Util.observe(retval, observer);
        }

        static observeProperty(object, prop, value, observer: IObserver) {
            if (typeof value === "function") {
                var proxy = Util.observe(object, observer);
                return function () {
                    return Util.observeFunction(proxy, value, observer, arguments);
                }
                // return this.observeFunction.bind({ object: proxy, func: propertyValue, observer });
            } else {
                observer.addDependency(Util.id(object), prop, value);
                return Util.observe(value, observer);
            }
        }

        static proxy(target, config) {
            if (typeof window["Proxy"] === "undefined")
                throw new Error("Browser is not supported");

            return new (window["Proxy"])(target, config);
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

            const id = object.$id;
            if (id === undefined)
                return object;

            if (typeof id === "function")
                return id();
            else
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

    class Binding {
        private data;
        public parent: TagBinding;
        public subscriptions = [];

        constructor(public context) { }

        addChild(child, idx) {
            throw new Error("Abstract method Binding.update");
        }

        // render(context) { throw new Error("Not implemented"); }

        update(context) {
            this.context = context;
            for (let s = 0; s < this.subscriptions.length; s++) {
                this.subscriptions[s].notify();
            }
        }
    }

    interface ISubscriber {
        notify();
    }

    class Observer {
        private all = new Set<ISubscriber>();
        // private dirty = new Set<ISubscriber>();
        private state = {};

        unsubscribe(subscription) {
            this.all.delete(subscription);
            // this.dirty.delete(subscription);
        }

        private static cache = [];

        subscribe(binding, ...additionalArgs) {
            var observer = this;

            var subscription = {
                binding,
                state: undefined,
                dependencies: [],
                addDependency(object: any, property: string, value: any) {
                    this.dependencies.push({ object, property, value });
                },
                hasDependency(object: any, property: string) {
                    for (var i = 0; i < this.dependencies.length; i++) {
                        var dep = this.dependencies[i];
                        if (dep.object === object && dep.property === property)
                            return true;
                    }
                    return false;
                },
                hasChanges(): boolean {
                    for (var i = 0; i < this.dependencies.length; i++) {
                        var dep = this.dependencies[i];
                        var value = dep.object[dep.property];
                        if (value !== dep.value)
                            return true;
                    }
                    return false;
                },
                // ReSharper disable UnusedParameter
                setChange(obj, property: string) {
                    throw new Error("invalid change");
                },
                // ReSharper restore UnusedParameter
                execute(state) {
                    this.state = binding.execute(binding.context.subscribe(this), state, additionalArgs);
                },
                notify() {
                    this.dependencies.length = 0;
                    var result = Util.ready(this.state, this);

                    if (this.dependencies.length > 0)
                        observer.all.add(this);
                    else
                        observer.unsubscribe(this);

                    return result;
                },
                then(resolve) {
                    return Util.ready(this.state, resolve);
                }
            };
            return subscription;
        }

        addDependency(obj, property) {
            // ignore
        }

        setChange(obj, property: string) {
            //this.all.forEach((s: any) => {
            //    if (s.hasChanges(obj, property)) {
            //        this.dirty.add(s);
            //    }
            //});
        }

        track(context) {
            return Util.observe(context, this);
        }

        update() {
            this.all.forEach((s: any) => {
                if (s.hasChanges()) {
                    s.notify();
                }
            });
        }
    }

    class ContentBinding extends Binding {
        private dom;

        constructor(private tpl: ContentTemplate, context) {
            super(context);

            this.dom = document.createDocumentFragment();
        }

        execute(context) {
            return this.dom;
        }
    }

    class TextBinding extends Binding {
        private dom;
        private value;

        constructor(private tpl: TextTemplate, context) {
            super(context);
            this.dom = document.createTextNode("");
        }

        execute(context) {
            var newValue = this.tpl.execute(context).valueOf();
            if (newValue !== this.value) {
                this.value = newValue;
                this.dom.textContent = newValue;
            }
        }
    }

    class TagBinding extends Binding {

        protected dom: HTMLElement;
        protected attrs = {};

        constructor(private tpl: TagTemplate, context) {
            super(context);

            this.dom = document.createElement(tpl.name);
            this.dom.attributes["__binding"] = this;
        }

        execute(context) {
            const tpl = this.tpl;

            tpl.executeAttributes(context, this, TagBinding.executeAttribute);

            return this.dom;
        }

        static executeAttribute(attrName: string, newValue, binding) {
            if (binding.attrs[attrName] === newValue)
                return;
            binding.attrs[attrName] = newValue;

            var dom = binding.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                dom.removeAttribute(attrName);
            } else {
                dom[attrName] = newValue;
                if (attrName === "value") {
                    dom["value"] = newValue;
                } else {
                    var domAttr = document.createAttribute(attrName);
                    domAttr.value = newValue;
                    dom.setAttributeNode(domAttr);
                }
            }
        }
    }

    class ObservableValue {
        private $id;

        constructor(private value, private observer: IObserver) {
            this.$id = Util.id(value);
        }

        get length() {
            if (this.value === null || this.value === undefined)
                return 0;
            const length = this.value.length;
            if (typeof length === "number") {
                return length;
            }
            return 1;
        }

        apply(context) {
            if (!!this.value && typeof this.value.apply === "function") {
                var value = this.value.apply(context, arguments);
                if (value !== null && value !== undefined) {
                    return new ObservableValue(value.valueOf(), this.observer);
                }
                return value;
            }
            throw new Error("is not a function");
        }

        prop(name) {
            var value = this.value[name];
            this.observer.addDependency(this.$id, name, value);

            if (this.value === null || this.value === undefined)
                return null;

            return new ObservableValue(value, this.observer);
        }

        map(fn) {
            return Util.map(fn, this.value);
        }

        valueOf() {
            return this.value;
        }
    }

    class Observable {
        public length = 1;

        constructor(private $id: any, private objects: any[], private lib: any, private observer: IObserver = null) {
        }

        prop(name) {
            for (let i = 0; i < this.objects.length; i++) {
                const object = this.objects[i];
                const value = object[name];
                if (value !== null && value !== undefined) {
                    if (typeof value.apply !== "function") {
                        this.observer.addDependency(Util.id(object), name, value);
                    }
                    return new ObservableValue(value.valueOf(), this.observer);
                }
            }

            return this.lib[name];
        }

        itemAt() {
            return this;
        }

        forEach(fn) {
            fn(this, 0);
        }

        extend(object): Observable {
            if (!object) {
                return this;
            }

            return new Observable(object, [object].concat(this.objects), this.lib);
        }

        subscribe(observer: IObserver) {
            if (this.observer === observer)
                return this;

            return new Observable(this.$id, this.objects, this.lib, observer);
        }
    }

    class ScopeBinding {
        constructor(private scope, private observer: Observer) {
        }

        get context() {
            return this.scope.context;
        }

        execute(observable, state, additionalArgs) {
            var tpl = additionalArgs[0];
            var target = additionalArgs[1];
            var offset = additionalArgs[2];

            var bindings = !!state ? state.bindings : [];
            if (!!tpl.modelAccessor) {
                return Util.ready(tpl.modelAccessor.execute(observable),
                    model => {
                        if (model === null || model === undefined)
                            return { bindings: [] };

                        var arr = !!model.forEach ? model : [model];
                        return { bindings: this.executeArray(observable, arr, offset, tpl, target, bindings) };
                    });
            } else {
                return { bindings: this.executeArray(observable, observable, offset, tpl, target, bindings) };
            }
        }

        executeArray(context, arr, offset, tpl, target, bindings) {
            Binder.removeBindings(target, bindings, arr.length);

            var startInsertAt = offset + bindings.length;

            for (var idx = 0; idx < arr.length; idx++) {
                var result = arr.itemAt(idx);

                if (idx < bindings.length) {
                    bindings[idx].update(result);
                } else {
                    const newBinding = tpl.bind(result);

                    var tagSubscription = this.observer.subscribe(newBinding);
                    tagSubscription.notify();

                    newBinding.subscriptions.push(tagSubscription);

                    tpl.children()
                        .reduce(Binder.reduceChild,
                            { context: result, offset: 0, parentBinding: newBinding, binder: this });

                    var insertAt = startInsertAt + idx;
                    if (insertAt < target.childNodes.length) {
                        var beforeElement = target.childNodes[insertAt];
                        target.insertBefore(newBinding.dom, beforeElement);
                    } else {
                        target.appendChild(newBinding.dom);
                    }
                    bindings.push(newBinding);
                }
            }
            // arr.forEach((result, idx) => this.mergeBinding(result, startInsertAt, tpl, target, bindings, idx));

            return bindings;
        }

        subscribe(tpl, target, offset: number = 0) {
            var subscription = this.observer.subscribe(this, tpl, target, offset);
            subscription.notify();
            return subscription;
        }
    }

    export class Binder {
        private context: Observable;

        constructor(viewModel, libs: any[], private observer: Observer = new Observer()) {
            this.context = new Observable(viewModel, [viewModel], libs.reduce((x, y) => Object.assign(x, y), {}));
        }

        get rootBinding() {
            return this.rootBinding = new ScopeBinding(this, this.observer);
        }

        static removeBindings(target, bindings, maxLength) {
            while (bindings.length > maxLength) {
                const oldBinding = bindings.pop();
                target.removeChild(oldBinding.dom);
            }
        }

        static reduceChild(prev, cur) {
            var parentBinding = prev.parentBinding;
            var binder: Binder = prev.binder;

            prev.offset = Util.ready(prev.offset,
                p => {
                    var subscr = binder.observer.subscribe(new ScopeBinding(parentBinding, binder.observer),
                        cur,
                        parentBinding.dom,
                        p);
                    subscr.notify();
                    parentBinding.subscriptions.push(subscr);

                    return subscr.then(x => { return p + x.bindings.length });
                });

            return prev;
        }

        static find(selector) {
            if (typeof selector === "string")
                return document.querySelector(selector);
            return selector;
        }

        subscribe(_, tpl, target, offset: number = 0) {
            var subscription = this.observer.subscribe(this.rootBinding, tpl, target, offset);
            subscription.notify();
            return subscription;
        }
    }

    var defaultApp = new Application([]);

    document.addEventListener("DOMContentLoaded", event => {
        defaultApp.start();
    });

    // ReSharper disable once InconsistentNaming
    export var Component = defaultApp.component.bind(defaultApp);
    export var update = defaultApp.update.bind(defaultApp);

    // ReSharper restore InconsistentNaming
}