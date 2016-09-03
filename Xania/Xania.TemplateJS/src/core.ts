interface IDomTemplate {
    bind(): Binding;
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

class ContentTemplate implements IDomTemplate {
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

    public bind() {
        return new TagBinding(this);
    }

    public select(modelAccessor) {
        this.modelAccessor = modelAccessor;
        return this;
    }

    public executeAttributes(context, dom, resolve) {
        var classes = [];

        this.attributes.forEach((tpl, name) => {
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
        resolve("class", Xania.join(" ", classes), dom);
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

class Xania {

    private static lut;
    static empty = [];

    static identity(x) {
        return x;
    }

    static ready(data, resolve) {

        //var args = new Array(arguments.length);
        //for (var i = 1; i < args.length; i++) {
        //    args[i - 1] = arguments[i];
        //}
        //args[args.length - 1] = data;

        if (data !== null && data !== undefined && typeof (data.then) === "function")
            return data.then(resolve);

        if (typeof (resolve.execute) === "function")
            return resolve.execute.call(resolve, data);

        return resolve.call(resolve, data);
    }

    static map(fn: Function, data: any) {
        if (data === null || data === undefined) {
            return Xania.empty;
        } else if (typeof data.then === "function") {
            return data.then(arr => {
                Xania.map(fn, arr);
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
        return Xania.partialFunc.bind({ context: this, func, baseArgs });
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
                ? Xania.observeArray(target, observer)
                : Xania.observeObject(target, observer);
        } else {
            return target;
        }
    }

    static observeArray(arr, observer: IObserver) {
        // ReSharper disable once InconsistentNaming
        return Xania.proxy(arr, {
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
                                if (Xania.id(item) === Xania.id(arr[i]))
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
                        return Xania.observeProperty(arr, property, arr[property], observer);
                    default:
                        if (arr.hasOwnProperty(property))
                            return Xania.observeProperty(arr, property, arr[property], observer);
                        return undefined;
                }
            },
            set(target, property, value, receiver) {
                if (Xania.id(arr[property]) !== Xania.id(value)) {
                    var length = arr.length;

                    arr[property] = value;
                    observer.setChange(Xania.id(arr), property);

                    if (arr.length !== length)
                        observer.setChange(Xania.id(arr), "length");
                }

                return true;
            }
        });
    }

    static observeObject(object, observer: IObserver) {
        return Xania.proxy(object, {
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
                        return Xania.observeProperty(object, property, object[property], observer);
                }
            },
            set(target, property, value, receiver) {
                if (Xania.id(object[property]) !== Xania.id(value)) {
                    object[property] = value;
                    observer.setChange(Xania.id(object), property);
                }

                return true;
            }
        });
    }

    static observeFunction(object, func, observer, args) {
        var retval = func.apply(object, args);

        return Xania.observe(retval, observer);
    }

    static observeProperty(object, prop, value, observer: IObserver) {
        if (typeof value === "function") {
            var proxy = Xania.observe(object, observer);
            return function () {
                return Xania.observeFunction(proxy, value, observer, arguments);
            }
            // return this.observeFunction.bind({ object: proxy, func: propertyValue, observer });
        } else {
            observer.addDependency(Xania.id(object), prop, value);
            return Xania.observe(value, observer);
        }
    }

    //static shallow(obj) {
    //    return Xania.assign({}, obj);
    //}

    // static assign = (<any>Object).assign;
    //static assign(target, ...args) {
    //    for (var i = 0; i < args.length; i++) {
    //        const object = args[i];
    //        for (let prop in object) {
    //            if (object.hasOwnProperty(prop)) {
    //                target[prop] = object[prop];
    //            }
    //        }
    //    }
    //    return target;
    //}

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

    addChild(child, idx) {
        throw new Error("Abstract method Binding.update");
    }

    // render(context) { throw new Error("Not implemented"); }

    // update(context) { throw new Error("Not implemented"); }
}

interface ISubsriber {
    notify();
}

class Observer {
    private dependencies = new Map<any, Map<string, Set<ISubsriber>>>();
    private dirty = new Set<ISubsriber>();
    private state = {};

    add(object: any, property: string, value: any, subsriber: ISubsriber) {
        var properties = this.dependencies.get(object);
        if (!!properties) {
            let subscriptions = properties.get(property);
            if (!!subscriptions) {
                if (!subscriptions.has(subsriber)) {
                    subscriptions.add(subsriber);
                    return true;
                }
            } else {
                subscriptions = new Set<ISubsriber>().add(subsriber);
                properties.set(property, subscriptions);
                return true;
            }
        } else {
            var subscriptions = new Set<ISubsriber>().add(subsriber);
            properties = new Map<string, Set<ISubsriber>>().set(property, subscriptions);
            this.dependencies.set(object, properties);
            return true;
        }

        return false;
    }

    get(object: any, property: string) {
        var properties = this.dependencies.get(object);
        if (!properties)
            return null;

        return properties.get(property);
    }

    unsubscribe(subscription) {
        while (subscription.dependencies.length > 0) {
            var dep = subscription.dependencies.pop();

            var properties = this.dependencies.get(dep.object);
            if (!!properties) {
                var subscriptions = properties.get(dep.property);
                if (!!subscriptions) {
                    subscriptions.delete(subscription);
                    if (subscriptions.size === 0) {
                        properties.delete(dep.property);
                        if (properties.size === 0) {
                            this.dependencies.delete(dep.object);
                        }
                    }
                }
            }
        }
        this.dirty.delete(subscription);
    }

    private static cache = [];

    subscribe(binding, ...additionalArgs) {
        var observer = this;

        var subscription = {
            context: null,
            state: undefined,
            dependencies: [],
            addDependency(object, property, value) {
                if (observer.add(object, property, value, this)) {
                    this.dependencies.push({ object, property });
                }
            },
            setChange(obj, property: string) {
                throw new Error("invalid change");
            },
            update(context: Observable) {
                // if (Xania.id(context) !== Xania.id(this.context)) {
                // if (subscription !== this)
                this.context = context.subscribe(this);
                this.notify();

                return this;
                // }
            },
            execute(state) {
                var key = additionalArgs.length;
                var args = Observer.cache[key];
                if (!args) {
                    Observer.cache[key] = args = new Array(3 + additionalArgs.length);
                    console.debug("create cache array ", key);
                }

                args[0] = this.context;
                args[1] = this;
                args[2] = state;
                for (var i = additionalArgs.length - 1; i >= 0; i--)
                    args[i + 3] = additionalArgs[i];

                this.state = binding.execute.apply(binding, args);
            },
            notify() {
                observer.unsubscribe(this);
                return Xania.ready(this.state, this);
            },
            then(resolve) {
                return Xania.ready(this.state, resolve);
            }
        };
        return subscription;
    }

    addDependency(obj, property) {
        // ignore
    }

    setChange(obj, property: string) {
        const subscribers = this.get(obj, property);
        if (!!subscribers) {
            subscribers.forEach(s => {
                this.dirty.add(s);
            });
        }
    }

    track(context) {
        return Xania.observe(context, this);
    }

    update() {
        if (this.dirty.size > 0) {
            // window.requestAnimationFrame(() => {
            this.dirty.forEach(subscriber => {
                subscriber.notify();
            });
            this.dirty.clear();
            // });
        }
    }
}

class ContentBinding extends Binding {
    private dom;

    constructor(private tpl: ContentTemplate) {
        super();

        this.dom = document.createDocumentFragment();
    }

    execute(context) {
        return this.dom;
    }
}

class TextBinding extends Binding {
    private dom;
    private value;

    constructor(private tpl: TextTemplate) {
        super();
        this.dom = document.createTextNode("");
    }

    execute(context) {
        var newValue = this.tpl.execute(context);
        if (newValue !== this.value) {
            this.value = newValue;
            this.dom.textContent = newValue;
        }
    }
}

class TagBinding extends Binding {

    protected dom: HTMLElement;

    constructor(private tpl: TagTemplate) {
        super();

        this.dom = document.createElement(tpl.name);
        this.dom.attributes["__binding"] = this;
    }

    execute(context) {
        const tpl = this.tpl;

        tpl.executeAttributes(context, this.dom, TagBinding.executeAttribute);

        return this.dom;
    }

    static executeAttribute(attrName: string, newValue, dom) {
        if (dom.attributes["__value"] === newValue)
            return;

        dom.attributes["__value"] = newValue;
        dom[attrName] = newValue;
        if (typeof newValue === "undefined" || newValue === null) {
            dom.removeAttribute(attrName);
        } else if (attrName === "value") {
            dom["value"] = newValue;
        } else {
            let domAttr = dom.attributes[attrName];
            if (!!domAttr) {
                domAttr.nodeValue = newValue;
                domAttr.value = newValue;
            } else {
                domAttr = document.createAttribute(attrName);
                domAttr.value = newValue;
                dom.setAttributeNode(domAttr);
            }
        }
    }
}

class ObservableValue {
    private $id;
    constructor(private value, private observer: IObserver) {
        this.$id = Xania.id(value);
    }

    get length() {
        if (this.value === null || this.value === undefined)
            return 0;
        const length = this.value.length;
        if (typeof length === "number")
            return length;
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
        return Xania.map(fn, this.value);
    }

    valueOf() {
        return this.value;
    }
}

class Observable {
    public length = 1;

    constructor(private $id: any, private objects: any[], private observer: IObserver = null) {
    }

    prop(name) {
        for (var i = 0; i < this.objects.length; i++) {
            var object = this.objects[i];
            var value = object[name];
            if (value !== null && value !== undefined) {
                if (typeof value.apply !== "function") {
                    this.observer.addDependency(Xania.id(object), name, value);
                }
                return new ObservableValue(value.valueOf(), this.observer);
            }
        }
        return undefined;
    }

    forEach(fn) {
        fn(this, 0);
    }

    extend(object): Observable {
        if (!object) {
            return this;
        }

        if (object instanceof Observable)
            return new Observable(object, object.objects.concat(this.objects));

        if (object instanceof ObservableValue) {
            var inner = object.value;
            return new Observable(inner, [inner].concat(this.objects));
        }

        return new Observable(object, [object].concat(this.objects));
    }

    reset(object): Observable {
        this.objects[0] = object;
        this.$id = object;

        return this;
    }

    subscribe(observer: IObserver) {
        if (this.observer === observer)
            return this;

        return new Observable(this.$id, this.objects, observer);
    }
}

class Binder {
    private observer = new Observer();
    private compile: Function;
    private target: HTMLElement;
    private compiler: Ast.Compiler;
    private rootContext: Observable;

    constructor(viewModel, lib: any[], target) {
        this.rootContext = new Observable(viewModel, [viewModel].concat(lib), null);
        this.compiler = new Ast.Compiler();
        this.compile = this.compiler.template.bind(this.compiler);
        this.target = target || document.body;

        this.init();
    }

    public import(templateUrl) {
        var binder = this;

        if (!("import" in document.createElement("link"))) {
            throw new Error("HTML import is not supported in this browser");
        }

        return {
            then(resolve) {
                var link = document.createElement('link');
                link.rel = 'import';
                link.href = templateUrl;
                link.setAttribute('async', ''); // make it async!
                link.onload = e => {
                    var link = (<any>e.target);
                    resolve.call(binder, link.import);
                }
                // link.onerror = function(e) {...};
                document.head.appendChild(link);
            }
        };
    }

    parseAttr(tagElement: TagTemplate, attr: Attr) {
        const name = attr.name;
        if (name === "click" || name.startsWith("keyup.")) {
            const fn = this.compile(attr.value);
            tagElement.addEvent(name, fn);
        } else if (name === "data-select" || name === "data-from") {
            const fn = this.compile(attr.value);
            tagElement.select(fn);
        } else if (name === "checked") {
            const fn = this.compile(attr.value);
            tagElement.attr(name, Xania.compose(ctx => !!ctx ? "checked" : null, fn));
        } else {
            const tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);

            // conventions
            if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && !tagElement.hasAttribute("value")) {
                const valueAccessor = this.compile(`{{ ${attr.value} }}`);
                tagElement.attr("value", valueAccessor);
            }
        }
    }

    static updateSubscription(observable, subscription, state = { bindings: <any[]>[] }) {

    }

    static removeBindings(target, bindings, maxLength) {
        while (bindings.length > maxLength) {
            const oldBinding = bindings.pop();
            target.removeChild(oldBinding.dom);
        }
    }

    static updateBindings(bindings, arr, context: Observable) {
        arr.map((item, idx) => {
            if (idx < bindings.length) {
                const binding = bindings[idx];
                for (let s = 0; s < binding.subscriptions.length; s++) {
                    var result = context.extend(arr[idx]);
                    binding.subscriptions[s].update(result);
                }
            }
        })
        //for (let idx = bindings.length - 1; idx >= 0; idx--) {

        //    const binding = bindings[idx];
        //    for (let s = 0; s < binding.subscriptions.length; s++) {
        //        var result = context.extend(arr[idx]);
        //        binding.subscriptions[s].update(result);
        //    }
        //}
    }

    addBindings(arr, offset, tpl: IDomTemplate, context: Observable) {
        var newBindings = [];
        var children = tpl.children();

        var reduceContext = { context: null, offset: 0, parentBinding: null, binder: this };

        arr.map((item, idx) => {
            if (idx >= offset) {
                const newBinding = tpl.bind();
                newBindings.push(newBinding);

                var tagSubscription = this.observer.subscribe(newBinding);
                // const result = context.extend(item);
                tagSubscription.update(item);

                newBinding.subscriptions.push(tagSubscription);

                reduceContext.context = item;
                reduceContext.parentBinding = newBindings[idx];
                reduceContext.offset = 0;

                children.reduce(Binder.reduceChild, reduceContext);
            }
        });
        //for (let idx = offset; idx < arr.length; idx++) {
        //    const newBinding = tpl.bind();
        //    newBindings.push(newBinding);

        //    var tagSubscription = this.observer.subscribe(newBinding);
        //    const result = context.extend(arr[idx]);
        //    tagSubscription.update(result);

        //    newBinding.subscriptions.push(tagSubscription);

        //    reduceContext.context = result;
        //    reduceContext.parentBinding = newBindings[idx];
        //    reduceContext.offset = 0;

        //    children.reduce(Binder.reduceChild, reduceContext);
        //}

        return newBindings;
    }

    static reduceChild(prev, cur) {
        var parentBinding = prev.parentBinding;
        var context = prev.context;
        var binder: Binder = prev.binder;

        prev.offset = Xania.ready(prev.offset,
            p => {
                var subscr = binder.subscribe(context, cur, parentBinding.dom, p);
                parentBinding.subscriptions.push(subscr);

                return subscr.then(x => { return p + x.bindings.length });
            });

        return prev;
    }

    mergeBinding(result, startInsertAt, tpl, target, bindings, idx) {
        if (idx < bindings.length) {
            const binding = bindings[idx];
            for (let s = 0; s < binding.subscriptions.length; s++) {
                binding.subscriptions[s].update(result);
            }
        } else {
            const newBinding = tpl.bind();

            var tagSubscription = this.observer.subscribe(newBinding);
            tagSubscription.update(result);

            newBinding.subscriptions.push(tagSubscription);

            tpl.children().reduce(Binder.reduceChild, { context: result, offset: 0, parentBinding: newBinding, binder: this });

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

    executeArray(context, arr, offset, tpl, target, bindings) {
        Binder.removeBindings(target, bindings, arr.length);

        var startInsertAt = offset + bindings.length;

        arr.forEach((result, idx) => {
            this.mergeBinding(result, startInsertAt, tpl, target, bindings, idx);
        });
        //for (var i = 0; i < arr.length; i++) {
        //    this.mergeBinding(arr.itemAt(i), startInsertAt, tpl, target, bindings, i);
        //}
        //arr.map((result, idx) => {
        //    if (idx < bindings.length) {
        //        const binding = bindings[idx];
        //        for (let s = 0; s < binding.subscriptions.length; s++) {
        //            binding.subscriptions[s].update(result);
        //        }
        //    } else {
        //        const newBinding = tpl.bind();

        //        var tagSubscription = this.observer.subscribe(newBinding);
        //        tagSubscription.update(result);

        //        newBinding.subscriptions.push(tagSubscription);

        //        children.reduce(Binder.reduceChild, { context: result, offset: 0, parentBinding: newBinding, binder: this });

        //        var insertAt = startInsertAt + idx;
        //        if (insertAt < target.childNodes.length) {
        //            var beforeElement = target.childNodes[insertAt];
        //            target.insertBefore(newBinding.dom, beforeElement);
        //        } else {
        //            target.appendChild(newBinding.dom);
        //        }
        //        bindings.push(newBinding);
        //    }
        //});

        return bindings;
    }

    execute(observable, subscription, state, tpl, target, offset) {
        var bindings = !!state ? state.bindings : [];
        if (!!tpl.modelAccessor) {
            return Xania.ready(tpl.modelAccessor.execute(observable),
                model => {
                    if (model === null || model === undefined)
                        return { bindings: [] };

                    var arr = !!model.forEach ? model : [model];
                    return { bindings: this.executeArray(subscription.context, arr, offset, tpl, target, bindings) };
                });
        } else {
            return { bindings: this.executeArray(subscription.context, subscription.context, offset, tpl, target, bindings) };
        }
    }

    subscribe(context, tpl, target, offset: number = 0) {
        return this.observer.subscribe(this, tpl, target, offset).update(context);
    }

    static find(selector) {
        if (typeof selector === "string")
            return document.querySelector(selector);
        return selector;
    }

    bind(templateSelector, targetSelector) {
        const target = Binder.find(targetSelector) || document.body;
        const template = this.parseDom(Binder.find(templateSelector));
        this.subscribe(this.rootContext, template, target);

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
            }
            else if (node.nodeType === 1) {
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

    private init() {
        var target = this.target;

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
                    const update = new Function("context", "value",
                        `with (context) { ${prop} = value; }`);
                    update(proxy, evt.target.value);
                }
            }
        };
        target.addEventListener("keyup", evt => {
            if (evt.keyCode === 13) {
                eventHandler(evt.target, "keyup.enter");
            } else {
                onchange(evt);
            }
            this.observer.update();
        });
    }
}
// ReSharper restore InconsistentNaming