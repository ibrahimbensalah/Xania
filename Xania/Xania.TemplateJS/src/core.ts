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

        component(...args) {
            if (args.length === 1 && typeof args[0] === "function") {
                const component = args[0];
                if (this.register(component, null)) {
                    return (component) => {
                        this.unregister(component);
                        this.register(component, args);
                    };
                }
            }

            return component => {
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

        start(root = document.body) {
            // Find top level components and bind
            var stack: Node[] = [root];

            while (stack.length > 0) {
                var dom = stack.pop();

                var component = this.getComponent(dom);
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

            this.listen(root);
            return this;
        }

        public listen(target) {
            var eventHandler = (target, name) => {
                var binding = target.attributes["__binding"];
                if (!!binding) {
                    var handler = binding.tpl.events.get(name);
                    if (!!handler) {
                        const observable = binding.context.valueOf();
                        Util.execute(handler, observable);
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
                        binding.context.set(nameAttr.value, evt.target.value);
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

        getComponent(node: Node) {
            var name = node.nodeName.replace(/\-/, "").toLowerCase();
            if (!this.components.has(name)) {
                return false;
            }
            var decl = this.components.get(name);
            var comp = !!decl.Args
                ? Reflect.construct(decl.Type, decl.Args)
                : new decl.Type;

            for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes.item(i);
                comp[attr.name] = eval(attr.value);
            }

            return comp;
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
                    binder.subscribe(tpl, target);
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
                tagElement.attr(name, ctx => {
                    var result = Util.execute(fn, ctx);
                    return !!result ? "checked" : null;
                });

                //tagElement.attr(name, Util.compose(ctx => {
                //    return !!ctx ? "checked" : null;
                //}, fn));
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
                var value = Util.execute(tpl, context);
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

            if (classes.length > 0) {
                resolve("class", Util.join(" ", classes), dom);
            }
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

    interface IDependency {
        object: any;
        property: any;
        value: any;
    }

    interface IObserver {
        addDependency(dependency: IDependency);
        setChange(obj: any, prop: any);
    }

    class Util {

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
                                // observer.addDependency(arr, "length", arr.length);
                                return (item) => {
                                    for (var i = 0; i < arr.length; i++) {
                                        if (Util.id(item) === Util.id(arr[i]))
                                            return i;
                                    }
                                    return -1;
                                }
                            case "length":
                                // observer.addDependency(arr, "length", arr.length);
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
                                // observer.addDependency(arr, "length", arr.length);
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

                            // if (arr.length !== length)
                            // observer.setChange(Util.id(arr), "length");
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
                            case "prop":
                                return property => {
                                    return Util.observeProperty(object, property, object[property], observer);
                                };
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
                observer.addDependency({ object: Util.id(object), property: prop, value });
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
        public dependencies: IDependency[] = [];
        public state = undefined;
        private childBindings = [];
        public id;

        constructor(public context = undefined) {
            // this.id = (new Date().getTime()) + Math.random();
        }

        subscribe(binding) {
            if (this.childBindings.indexOf(binding) < 0) {
                this.childBindings.push(binding);
            }
        }

        unsubscribe(binding) {
            var idx = this.childBindings.indexOf(binding);
            if (idx >= 0) {
                this.childBindings.splice(idx, 1);
            }
        }

        addDependency(dependency: IDependency) {
            this.dependencies.push(dependency);
        }

        notify(observer) {
            var stack: any[] = [this];

            stack[0].observer = observer;
            while (stack.length > 0) {
                var binding = stack.pop();
                if (binding.hasChanges()) {
                    binding.update(binding.observer);
                }

                for (var i = 0; i < binding.childBindings.length; i++) {
                    const child = binding.childBindings[i];
                    child.observer = binding;
                    stack.push(child);
                }
            }

            //if (this.hasChanges()) {
            //    this.update(observer);
            //}

            //for (var i = 0; !!this.childBindings && i < this.childBindings.length; i++) {
            //    const child = this.childBindings[i];
            //    child.notify(this);
            //}
        }

        update(observer) {
            var binding = <any>this;
            binding.dependencies.length = 0;

            Util.ready(binding.state,
                s => {
                    binding.state = binding.execute(s);

                    if ((binding.childBindings.length > 0) || (binding.dependencies.length > 0))
                        observer.subscribe(binding);
                    else
                        observer.unsubscribe(binding);
                });
        }

        hasChanges(): boolean {
            if (!this.dependencies) {
                return true;
            }

            var deps = this.dependencies;
            for (var i = 0; i < deps.length; i++) {
                var dep = deps[i];
                var value = dep.object[dep.property];

                value = !!value ? value.valueOf() : value;
                if (value !== dep.value)
                    return true;
            }
            return false;
        }
    }

    interface ISubscriber {
        notify();
    }

    class Observer {
        private bindings = [];
        // private dirty = new Set<ISubscriber>();

        subscribe(binding) {
            if (this.bindings.indexOf(binding) < 0) {
                this.bindings.push(binding);
            }
            // var x = 0, length = this.all.length;

            //while (length > 0) {
            //    var m = length >> 1;
            //    var e = this.all[x + m];
            //    if (e === binding)
            //        return;
            //    else if (e.id < binding.id) {
            //        length = m;
            //    } else if (m === 0) {
            //        length = 0;
            //        x++;
            //    } else {
            //        length = length - m;
            //        x += m;
            //    }
            //}

            //for (var i = this.all.length; i > x; i--) {
            //    this.all[i] = this.all[i-1];
            //}
            //this.all[x] = binding;
        }

        unsubscribe(binding) {
            var idx = this.bindings.indexOf(binding);
            if (idx >= 0) {
                this.bindings.splice(idx, 1);
            }
            // this.all.delete(binding);
            // this.dirty.delete(subscription);
        }

        update() {
            //this.all.forEach(binding => {
            //    binding.notify(this);
            //});
            if (this.bindings.length != Observer['dummy']) {
                Observer['dummy'] = this.bindings.length;
                console.log(this.bindings.length);
            }
            for (var i = 0; i < this.bindings.length; i++) {
                const binding = this.bindings[i];
                binding.notify(this);
            }
        }
    }

    class ContentBinding extends Binding {
        private dom;

        constructor(private tpl: ContentTemplate, context) {
            super(context);
            this.dom = document.createDocumentFragment();
        }

        execute() {
            return this.dom;
        }
    }

    class TextBinding extends Binding {
        private dom;

        constructor(private tpl: TextTemplate, context) {
            super(context);
            this.dom = document.createTextNode("");
        }

        execute() {
            var observable = (<any>this.context).subscribe(this);
            var newValue = this.tpl.execute(observable).valueOf();

            this.setText(newValue);
        }

        setText(newValue) {
            // if (Math.random() < 0.01)
            this.dom.textContent = newValue;
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

        execute() {
            const tpl = this.tpl;

            var observable = (<any>this.context).subscribe(this);
            tpl.executeAttributes(observable, this, TagBinding.executeAttribute);

            return this.dom;
        }

        static executeAttribute(attrName: string, newValue, binding: TagBinding) {
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
        }
    }

    class ObservableFunction {
        constructor(private func, private context, private observer: IObserver) {
        }

        execute() {
            var value = this.func.apply(this.context, arguments);
            return Observable.value(this.context, value, this.observer);
        }

        prop(name): any {
            var value = this.func[name];
            if (!!this.observer)
                this.observer.addDependency({
                    object: this.func,
                    property: name,
                    value: !!value ? value.valueOf() : value
                });

            return Observable.value(this.func, value, this.observer);
        }
    }

    class ObservableArray {
        private $id;

        constructor(private arr, private observer: IObserver) {
            this.$id = Util.id(arr);
        }

        get length() {
            return this.arr.length;
        }

        itemAt(idx) {
            var item = this.arr[idx];
            if (!!this.observer)
                this.observer.addDependency({
                    object: this.arr,
                    property: idx,
                    value: item.valueOf()
                });

            return Observable.value(this.arr, item, this.observer);
        }

        filter(fn) {
            const result = [];
            var length = this.arr.length;
            for (var i = 0; i < length; i++) {
                var item = this.arr[i];
                if (!!this.observer)
                    this.observer.addDependency({
                        object: this.arr,
                        property: i,
                        value: item.valueOf()
                    });

                if (!!Util.execute(fn, item))
                    result.push(item);
            }
            return new ObservableArray(result, this.observer);
        }

        count(fn) {
            var count = 0;
            for (var i = this.arr.length - 1; i >= 0; i--) {
                var item = this.arr[i];
                if (!!this.observer)
                    this.observer.addDependency({
                        object: this.arr,
                        property: i,
                        value: item
                    });

                if (!!Util.execute(fn, item))
                    count++;
            }
            return count;
        }
    }

    class ObservableValue {
        constructor(private value, private observer: IObserver) {
        }

        get length() {
            return 1;
        }

        prop(name): any {
            var value = this.value[name].valueOf();
            if (!!this.observer)
                this.observer.addDependency({
                    object: this.value,
                    property: name,
                    value
                });

            return Observable.value(this.value, value, this.observer);
        }

        valueOf() {
            return this.value;
        }

        scope(object, value) {
            return Observable.value(object, value, this.observer);
        }

        itemAt(idx) {
            return this;
        }

        subscribe(observer: IObserver) {
            if (this.observer === observer)
                return this;

            return new ObservableValue(this.value, observer);
        }
    }

    class ImmutableValue {
        constructor(private value) {
        }

        get length() {
            return 1;
        }

        prop(name): any {
            var value = this.value[name];

            if (value === null || value === undefined)
                return value;

            return new ImmutableValue(value);
        }

        valueOf() {
            return this.value;
        }
    }

    class ObservableConst {
        private length = 0;
        constructor(private value, private observer: IObserver) { }

        valueOf() {
            return this.value;
        }
    }

    class Observable {
        public length = 1;

        constructor(private $id: any, private objects: any[], private lib: any, private observer: IObserver = null) {
        }

        valueOf() {
            debugger;
            var obj = {};
            for (var i = 0; i < this.objects.length; i++) {
                Object.assign(obj, this.objects[i]);
            }
            return obj;
        }

        prop(name) {
            for (let i = 0; i < this.objects.length; i++) {
                const object = this.objects[i];
                const value = object[name];
                if (value !== null && value !== undefined) {
                    if (!!this.observer && typeof value !== "function") {
                        this.observer.addDependency({
                            object,
                            property: name,
                            value: value
                        });
                    }
                    return Observable.value(object, value, this.observer);
                }
            }

            return this.lib[name];
        }

        set(name, value) {
            debugger;
            for (let i = 0; i < this.objects.length; i++) {
                const object = this.objects[i];
                if (object.hasOwnProperty(name)) {
                    object[name] = value;
                    break;
                }
            }

            return value;
        }

        static value(object, value, observer: IObserver): any {
            if (value === null || value === undefined || typeof value === "boolean" ||
                typeof value === "number" || typeof value === "string")
                return value;

            else if (typeof value === "function" ||
                typeof value.execute === "function" ||
                typeof value.apply === "function" ||
                typeof value.call === "function") {
                return new ObservableFunction(value, object, observer);
            } else if (Array.isArray(value)) {
                return new ObservableArray(value, observer);
            //} else if (!!value.lastMutationId) {
            //    observer.addDependency({ object: value, property: "lastMutationId", value: value.lastMutationId });
            //    return value;
            } else {
                return new ObservableValue(value, observer);
            }
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

    class ScopeBinding extends Binding {
        constructor(private scope, private observer: Observer, private tpl, private target, private offset: number) {
            super(scope.context);
        }

        get context() {
            return this.scope.context;
        }

        execute(state) {
            var observable = (<any>this.context).subscribe(this);
            var tpl = this.tpl;
            var target = this.target;
            var offset = this.offset;

            var bindings = !!state ? state.bindings : [];
            if (!!tpl.modelAccessor) {
                return Util.ready(tpl.modelAccessor.execute(observable),
                    model => {
                        if (model === null || model === undefined)
                            return { bindings: [] };

                        var arr = !!model.itemAt ? model : [model];
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
                    bindings[idx].update(result, this);
                } else {
                    const newBinding = tpl.bind(result);

                    tpl.children()
                        .reduce(Binder.reduceChild,
                            { context: result, offset: 0, parentBinding: newBinding, binder: this });

                    newBinding.update(this);
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
    }

    export class Binder {
        private context: Observable;

        constructor(viewModel, libs: any[], private observer: Observer = new Observer()) {
            this.context = new Observable(viewModel, [viewModel], libs.reduce((x, y) => Object.assign(x, y), {}));
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
                    var binding = new ScopeBinding(parentBinding, parentBinding, cur, parentBinding.dom, p);
                    // var subscr = binder.observer.subscribe(binding);
                    binding.update(parentBinding);

                    return Util.ready(binding.state, x => { return p + x.bindings.length });
                });

            return prev;
        }

        static find(selector) {
            if (typeof selector === "string")
                return document.querySelector(selector);
            return selector;
        }

        subscribe(tpl, target, offset: number = 0) {
            var rootBinding = new ScopeBinding(this, this.observer, tpl, target, offset);
            rootBinding.update(this.observer);
            return rootBinding;
        }
    }

    //var defaultApp = app();

    //document.addEventListener("DOMContentLoaded", event => {
    //    defaultApp.start(document.body);
    //});

    // ReSharper disable once InconsistentNaming
    //export var Component = defaultApp.component.bind(defaultApp);
    //export var update = defaultApp.update.bind(defaultApp);

    export function app(...libs: any[]) {
        return new Application(libs);
    };

    // ReSharper restore InconsistentNaming
}