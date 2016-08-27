interface IDomTemplate {
    bind(model, idx): Binding;
    modelAccessor;
    children();
}

class TextTemplate implements IDomTemplate {
    modelAccessor;
    constructor(private tpl) {
    }
    execute(context) {
        return typeof this.tpl == "function"
            ? this.tpl(context)
            : this.tpl;
    }
    bind(model) {
        return new TextBinding(this, model);
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

    bind(model, idx): Binding {
        return new ContentBinding(this, model);
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

    public attr(name: string, value: string | Function) {
        return this.addAttribute(name, value);
    }

    public addAttribute(name: string, value: string | Function) {

        var tpl = typeof (value) === "function"
            ? value
            : () => value;

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

    public bind(model) {
        return new TagBinding(this, model);
    }

    public select(modelAccessor) {
        this.modelAccessor = modelAccessor;
        return this;
    }

    public executeAttributes(context) {
        var result = {
            "class": []
        };

        this.attributes.forEach((tpl, name) => {
            var value = tpl(context);
            if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    result["class"].push(className);
                }
            } else if (name === "class") {
                var cls = value.split(" ");
                result["class"].push.apply(result["class"], cls);
            } else {
                result[name] = value;
            }
        });

        return result;
    }

    public executeEvents(context) {
        var result: any = {};

        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
        }

        this.events.forEach((callback, eventName) => {
            result[eventName] = callback.bind(this, context);
        });

        return result;
    }

}

class SelectManyExpression {
    constructor(public varName: string, private viewModel: string,
        public collectionExpr, private loader: any) {

        if (collectionExpr === undefined || collectionExpr === null) {
            throw new Error("null argument exception");
        }
    }

    execute(context) {
        var collectionFunc = new Function("m", `with(m) { return ${this.collectionExpr}; }`),
            varName = this.varName;
        if (Array.isArray(context))
            throw new Error("context is Array");

        var col = collectionFunc(context);

        return Xania.promise(col).then(data => {
            var arr = Array.isArray(data) ? data : [data];

            var results = [];
            for (var i = 0; i < arr.length; i++) {
                const result = {};
                result[varName] = arr[i];

                results.push(result);
            }

            return results;
        });
    }

    static parse(expr, loader = t => <any>window[t]) {
        const m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+of\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            // ReSharper disable once UnusedLocals
            const [, varName, , itemType, , directive, collectionExpr] = m;
            var viewModel = loader(itemType);
            return new SelectManyExpression(
                varName,
                viewModel,
                collectionExpr,
                loader);
        }
        return null;
    }

    private static ensureIsArray(obj) {
        return Array.isArray(obj) ? obj : [obj];
    }

    items: any[] = [];
}

class Value {
    private obj;
    constructor(obj) {
        this.obj = obj;
    }

    valueOf() {
        return this.obj;
    }
}

interface IObserver {
    setRead(obj: any, prop: string);
    setChange(obj: any, prop: any);
}

class Xania {

    private static lut;

    static identity(x) {
        return x;
    }

    static composable(data) {
        return data !== null && data !== undefined && typeof (data.then) === "function";
    }

    static promise(data) {
        if (data !== null && data !== undefined && typeof (data.then) === "function") {
            return data;
        }

        return {
            then(resolve, ...args: any[]) {
                const result = resolve.apply(this, args.concat([data]));
                if (result === undefined)
                    return this;
                return Xania.promise(result);
            }
        };
    }

    static map(fn: Function, data: any) {
        if (typeof data.then === "function") {
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
                        observer.setRead(arr, "length");
                        return (item) => {
                            for (var i = 0; i < arr.length; i++) {
                                if (Xania.id(item) === Xania.id(arr[i]))
                                    return i;
                            }
                            return -1;
                        }
                    case "length":
                        observer.setRead(arr, "length");
                        return arr.length;
                    case "constructor":
                        return Array;
                    case "splice":
                    case "some":
                    case "every":
                    case "slice":
                    case "filter":
                    case "map":
                    case "pop":
                    case "push":
                        observer.setRead(arr, "length");
                        return Xania.observeProperty(arr, property, observer);
                    default:
                        if (arr.hasOwnProperty(property))
                            return Xania.observeProperty(arr, property, observer);
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

    static unwrap(obj, cache: Set<any> = null) {
        if (obj === undefined || obj === null || typeof (obj) !== "object")
            return obj;

        if (!!cache && cache.has(obj))
            return obj;

        if (!!obj.isSpy) {
            return Xania.unwrap(obj.valueOf(), cache);
        }

        if (!cache)
            cache = new Set();
        cache.add(obj);

        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = Xania.unwrap(obj[prop], cache);
            }
        }

        return obj;
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
                        return Xania.observeProperty(object, property, observer);
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

    static observeFunction() {
        var self = (<any>this);
        var retval = self.func.apply(self.object, arguments);

        return Xania.observe(retval, self.observer);
    }

    static observeProperty(object, propertyName, observer: IObserver) {
        var propertyValue = object[propertyName];
        if (typeof propertyValue === "function") {
            var proxy = Xania.observe(object, observer);
            return this.observeFunction.bind({ object: proxy, func: propertyValue, observer });
        } else {
            observer.setRead(Xania.id(object), propertyName);
            if (propertyValue === null || typeof propertyValue === "undefined") {
                return null;
            }
            else {
                return Xania.observe(propertyValue, observer);
            }
        }
    }



    static shallow(obj) {
        return Xania.assign({}, obj);
    }

    // static assign = (<any>Object).assign;
    static assign(target, ...args) {
        for (var i = 0; i < args.length; i++) {
            const object = args[i];
            for (let prop in object) {
                if (object.hasOwnProperty(prop)) {
                    target[prop] = object[prop];
                }
            }
        }
        return target;
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
    public destroyed = false;

    constructor(public context) {
    }

    addChild(child, idx) {
        throw new Error("Abstract method Binding.update");
    }

    destroy() { throw new Error("Not implemented"); }

    render(context) { throw new Error("Not implemented"); }
}

interface ISubsriber {
    notify();
}

class Observer {
    private subscriptions = new Map<any, any>();
    private dirty = new Set<ISubsriber>();
    private state = {};

    add(object: any, property: string, subsriber: ISubsriber) {
        if (this.subscriptions.has(object)) {
            const deps = this.subscriptions.get(object);

            if (deps.hasOwnProperty(property)) {
                if (!deps[property].has(subsriber)) {
                    deps[property].add(subsriber);
                    return true;
                }
            } else {
                deps[property] = new Set<ISubsriber>().add(subsriber);
                return true;
            }
        } else {
            const deps = {};
            deps[property] = new Set<ISubsriber>().add(subsriber);
            this.subscriptions.set(object, deps);
            return true;
        }

        return false;
    }

    get(object: any, property: string) {
        if (!this.subscriptions.has(object))
            return null;

        const deps = this.subscriptions.get(object);

        if (deps.hasOwnProperty(property))
            return deps[property];

        return null;
    }

    unsubscribe(subscription) {
        while (subscription.dependencies.length > 0) {
            var dep = subscription.dependencies.pop();

            const deps = this.subscriptions.get(dep.obj);

            deps[dep.property].delete(subscription);
            if (deps[dep.property].size === 0) {
                delete deps[dep.property];

                if (Object.keys(deps).length === 0) {
                    this.subscriptions.delete(dep.obj);
                }
            }
        }
        subscription.children.forEach(child => {
            this.unsubscribe(child);
        });
        subscription.children.clear();
        this.dirty.delete(subscription);
    }

    subscribe(context, update, ...additionalArgs) {
        var observer = this,
            // ReSharper disable once JoinDeclarationAndInitializerJs
            observable: Object | void,
            // ReSharper disable once JoinDeclarationAndInitializerJs
            updateArgs: (Object | void)[];

        var subscription = {
            parent: undefined,
            children: new Set<any>(),
            state: undefined,
            dependencies: [],
            notify() {
                observer.unsubscribe(this);
                return Xania.promise(this.state)
                    .then(s => this.state = update.apply(observer, updateArgs.concat([s])));
            },
            then(resolve) {
                return Xania.promise(this.state).then(resolve);
            },
            subscribe(...args) {
                return observer.subscribe.apply(observer, args);
            },
            attach(parent) {
                if (this.parent === parent)
                    return;
                if (!!this.parent)
                    this.parent.children.delete(this);
                this.parent = parent;
                if (!!parent)
                    parent.children.add(this);
            }
        };
        observable = Xania.observe(context, {
            setRead(obj, property) {
                if (observer.add(obj, property, subscription)) {
                    subscription.dependencies.push({ obj, property });
                }
            },
            setChange(obj, property: string) {
                throw new Error("invalid change");
            }
        });
        updateArgs = [observable, subscription].concat(additionalArgs);
        subscription.notify();

        return subscription;
    }

    setRead(obj, property) {
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

    get size() {
        var total = 0;
        this.subscriptions.forEach(deps => {
            for (let p in deps) {
                if (deps.hasOwnProperty(p)) {
                    total += deps[p].size;
                }
            }
        });

        return total;
    }
}

class ContentBinding extends Binding {
    private dom;

    constructor(private tpl: ContentTemplate, context) {
        super(context);

        this.dom = document.createDocumentFragment();
    }

    render(context) {
        return this.dom;
    }
}

class TextBinding extends Binding {
    private dom;

    constructor(private tpl: TextTemplate, context) {
        super(context);

        this.dom = document.createTextNode("");
    }

    update(context) {
        this.dom.textContent = this.tpl.execute(context);
    }

    destroy() {
        if (!!this.dom) {
            this.dom.remove();
        }
        this.destroyed = true;
    }

    render(context) {
        this.dom.textContent = this.tpl.execute(context);
    }
}

class TagBinding extends Binding {

    public children: Binding[] = [];
    protected dom: HTMLElement;

    constructor(private tpl: TagTemplate, context) {
        super(context);

        this.dom = document.createElement(tpl.name);
        this.dom.attributes["__binding"] = this;
    }

    render(context) {
        const tpl = this.tpl;
        const dom = this.dom;

        const attributes = tpl.executeAttributes(context);
        for (let attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                const newValue = Xania.join(" ", attributes[attrName]);

                if (dom.attributes.hasOwnProperty(attrName) && dom[attrName] === newValue)
                    continue;

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

        return dom;
    }

    destroy() {
        if (!!this.dom) {
            this.dom.remove();
        }
        this.destroyed = true;
    }
}

class Binder {
    private observer = new Observer();
    private compile: Function;
    private target: HTMLElement;
    private compiler: Ast.Compiler;

    constructor(public model, target = null) {
        Xania.assign(model, Fun.List);
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


    execute(rootContext, rootTpl, rootTarget) {

        var visit = (parent, context, tpl, target, offset: number) => {
            return this.observer.subscribe(context, (observable, subscription, state = { length: 0 }) => {
                var visitArray = arr => {
                    var prevLength = state.length;

                    for (let e = prevLength - 1; e >= 0; e--) {
                        const idx = offset + e;
                        target.removeChild(target.childNodes[idx]);
                    }

                    var docfrag = document.createDocumentFragment();

                    for (let idx = 0; idx < arr.length; idx++) {

                        const result = !!arr[idx] ? Xania.assign({}, context, arr[idx]) : context;
                        var binding = tpl.bind(result);

                        this.observer.subscribe(result, binding.render.bind(binding)).attach(subscription);

                        const visitChild = Xania.partialApp((data, parent, prev, cur) => {
                            return Xania.promise(prev)
                                .then(p => {
                                    return visit(subscription, data, cur, parent, p).then(x => p + x.length);
                                });
                        }, result, binding.dom);

                        tpl.children().reduce(visitChild, 0);
                        docfrag.appendChild(binding.dom);
                    }

                    if (offset < target.childNodes.length)
                        target.insertBefore(docfrag, target.childNodes[offset]);
                    else
                        target.appendChild(docfrag);

                    return { length: arr.length };
                };

                subscription.attach(parent);

                if (!!tpl.modelAccessor) {
                    return Xania.promise(tpl.modelAccessor(observable))
                        .then(model => {
                            if (model === null || model === undefined)
                                return [];

                            // model = Xania.unwrap(model);
                            return visitArray(Array.isArray(model) ? model : [model]);
                        });
                } else {
                    return visitArray([null]);
                }
            });
        };
        visit(null, rootContext, rootTpl, rootTarget, 0);
    }

    static find(selector) {
        if (typeof selector === "string")
            return document.querySelector(selector);
        return selector;
    }

    bind(templateSelector, targetSelector) {
        const target = Binder.find(targetSelector) || document.body;
        const template = this.parseDom(Binder.find(templateSelector));
        this.execute(this.model, template, target);

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
                const tpl = this.compile(node.textContent);
                push(new TextTemplate(tpl || node.textContent));
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