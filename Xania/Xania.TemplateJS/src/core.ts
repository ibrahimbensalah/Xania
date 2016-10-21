module Xania {

    "use strict";

    class Application {
        private components = new Map<string, any>();
        private compile: Function;
        private compiler: Ast.Compiler;
        private contexts: IValue[] = [];

        constructor(private libs: any[]) {
            this.compiler = new Ast.Compiler();
            this.compile = this.compiler.template.bind(this.compiler);
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
                        this.update();
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
                    this.update();
                });
        }

        public update() {
            for (let i = 0; i < this.contexts.length; i++) {
                var ctx = this.contexts[i];
                ctx.update(null);
            }
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

        import(view, ...args): any {
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
        bind(view, viewModel, target: Node) {
            var observable = new RootContainer(viewModel, this.libs.reduce((x, y) => Object.assign(x, y), {}));

            this.contexts.push(observable);

            Util.ready(this.import(view),
                dom => {
                    var tpl = this.parseDom(dom);
                    Binder.executeTemplate(observable, tpl, target, 0);
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

    class RootContainer implements IValue {
        private properties = {};

        constructor(private instance: any, private libs) {
        }

        get(name): IValue {
            var existing = this.properties[name];
            if (!!existing)
                return existing;

            return this.properties[name] = new Immutable(this.instance[name]);
        }

        subscribe(subscr: ISubscriber) { throw new Error("Not implemented"); }

        execute(args: any[]) { throw new Error("Not implemented"); }

        update() {
            for (let k in this.properties) {
                const prop: Immutable = this.properties[k];
                prop.update();
            }
        }

        forEach(fn) {
            fn(this);
        }

        extend(name, value) {
            return new Container(this).add(name, value);
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

        public bind(context) {
            return new TagBinding(this, context);
        }

        public select(modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        }

        public dataMutationId;

        public executeAttributes(context, binding, resolve) {
            var classes = [];

            this.attributes.forEach(function attributesForEachBoundFn(tpl, name) {
                var value = Util.execute(tpl, context).valueOf();

                if (value !== null && value !== undefined && !!value.valueOf)
                    value = value.valueOf();
                if (name === "checked") {
                    resolve(name, !!value ? "checked" : null, binding);
                } else if (name === "class") {
                    classes.push(value);
                } else if (name.startsWith("class.")) {
                    if (!!value) {
                        var className = name.substr(6);
                        classes.push(className);
                    }
                } else {
                    resolve(name, value, binding);
                }
            });

            resolve("class", classes.length > 0 ? Util.join(" ", classes) : null, binding);
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

    interface IObserver extends ISubscriber {
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
        private context;

        update(context) {
            this.context = context;
            var binding = this as any;

            // binding.state = binding.execute(binding.state, context);

            Util.ready(binding.state,
                s => {
                    binding.state = binding.execute(s, context);
                });
        }

        itemAt(arr: any, idx: number): any {
            return arr.itemAt(idx);
        }
        property(obj: IValue, name: string): any {
            var result = obj.get(name);
            result.subscribe(this);
            return result;
        }
        extend(context, varName: string, x: any) {
            return context.extend(varName, x);
        }

        notify() {
            this.update(this.context);
        }
    }

    interface ISubscriber {
        notify();
    }

    class ContentBinding extends Binding {
        private dom;

        constructor(private tpl: ContentTemplate) {
            super();
            this.dom = document.createDocumentFragment();
        }

        execute() {
            return this.dom;
        }
    }

    class TextBinding extends Binding {
        private dom;

        constructor(private tpl: TextTemplate) {
            super();
            this.dom = document.createTextNode("");
        }

        execute(state, context) {
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

        constructor(private tpl: TagTemplate, context) {
            super();
            this.dom = document.createElement(tpl.name);
            this.dom.attributes["__binding"] = this;
        }

        execute(state, context) {
            const tpl = this.tpl;

            tpl.executeAttributes(context, this, TagBinding.executeAttribute);

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

    class Immutable implements IValue {
        private properties = {};

        constructor(private value) {

        }

        update() {
            let properties = this.properties;
            for (var n in properties) {
                if (properties.hasOwnProperty(n)) {
                    properties[n].update(this.value);
                }
            }
        }

        get(name): IValue {
            var existing = this.properties[name];
            if (!!existing)
                return existing;

            return this.properties[name] = new Property(this.value, name);
        }

        valueOf() {
            return this.value;
        }

        subscribe(subscr: ISubscriber) { return false; }

        hasChanges(): boolean { return false; }

        execute(args: any[]) {
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
    }
    interface IValue {
        get(idx): IValue;
        valueOf(): any;
        subscribe(subscr: ISubscriber);
        execute(args: any[]);
        update(context: any);
    }

    class Sequence implements IValue {
        private subscribers: ISubscriber[] = [];

        constructor(private arr) {
            this.length = arr.length;
        }

        static create(value) {
            return new Sequence(value);
        }

        get(idx): IValue {
            return this.arr[idx];
        }

        subscribe(subscr: ISubscriber) {
            if (this.subscribers.indexOf(subscr) < 0)
                this.subscribers.push(subscr);
        }

        execute(args: any[]) { throw new Error("Not implemented"); }

        update() {
            for (var i = 0; i < this.arr.length; i++) {
                this.arr[i].notify();
            }
        }

        hasChanges(): boolean { return false; }

        length: number;

        forEach(fn) {
            for (var i = 0; i < this.arr.length; i++) {
                var item = this.arr[i];
                // var value = new Value(this.arr, i, item);
                fn(item);
            }
            return this;
        }
    }

    interface IProvider {
        get(name): IProvider;
    }

    class Container implements IProvider {
        private map = {};

        constructor(private parent: IProvider = null) {

        }

        add(name, value: IValue) {
            this.map[name] = value;
            return this;
        }

        extend(name, value) {
            return new Container().add(name, value);
        }

        get(name): IValue {
            return this.map[name];
        }

        forEach(fn) {
            fn(this, 0);
        }
    }

    class Property implements IValue {
        private subscribers: ISubscriber[] = [];
        private properties = [];
        private value;

        constructor(context: any, public name: string | number) {
            this.value = context[name];
        }

        subscribe(subscr: ISubscriber) {
            if (this.subscribers.indexOf(subscr) < 0)
                this.subscribers.push(subscr);
        }

        update(context) {
            var stack = [{ property: this, context }];

            var dirty = new Set<ISubscriber>();
            var hits = 0; 

            while (stack.length > 0) {
                var cur = stack.pop();

                const currentValue = cur.context[cur.property.name];
                if (cur.property.value !== currentValue) {
                    cur.property.value = currentValue;

                    for (var n = 0; n < cur.property.subscribers.length; n++) {
                        var subscr = cur.property.subscribers[n];
                        if (dirty.has(subscr)) {
                            hits++;
                        }
                        dirty.add(subscr);
                    }
                    // this.subscribers.length = 0;
                }

                let properties = cur.property.properties;
                for (var i = 0; i < properties.length; i++) {
                    stack.push({ property: properties[i], context: currentValue });
                }
            }

            dirty.forEach(d => {
                d.notify();
            });
        }

        get(name) {
            for (var i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                if (property.name === name)
                    return property;
            }

            var result = new Property(this.value, name);
            this.properties.push(result);
            return result;
        }

        valueOf() {
            return this.value;
            // return this.instance.value[this.name];
        }

        hasChanges(): boolean {
            return this.value !== this.valueOf();
        }

        execute(args: any[]) {
            return null;
        }

        forEach(fn) {
            fn(this, 0);
        }

        map(fn) {
            var result = [];
            for (var i = 0; i < this.value.length; i++) {
                var item = this.get(i);
                result.push(fn(item));
            }

            return Sequence.create(result);
        }

        id;
    }

    export class Binder {
        private context: RootContainer;

        constructor(viewModel, libs: any[]) {
            this.context = new RootContainer(viewModel, libs.reduce((x, y) => Object.assign(x, y), {}));
        }

        static removeBindings(target, bindings, maxLength) {
            while (bindings.length > maxLength) {
                const oldBinding = bindings.pop();
                target.removeChild(oldBinding.dom);
            }
        }

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

        static executeTemplate(observable, tpl, target, offset, state?) {
            if (!!tpl.modelAccessor) {
                return Util.ready(tpl.modelAccessor.execute(observable),
                    model => {
                        return {
                            bindings: Binder.executeArray(model, offset, tpl, target, state),
                            data: <any>model
                        };
                    });
            } else {
                return {
                    bindings: Binder.executeArray(observable, offset, tpl, target, state),
                    data: observable
                };
            }
        }

        static executeArray(arr, offset, tpl, target, state) {
            const bindings = !!state ? state.bindings : [];

            Binder.removeBindings(target, bindings, arr.length);

            var startInsertAt = offset + bindings.length;

            arr.forEach((result, idx) => {
                if (idx < bindings.length) {
                    // bindings[idx].update(result);
                } else {
                    const newBinding = tpl.bind();

                    tpl.children()
                        .reduce(Binder.reduceChild,
                        { context: result, offset: 0, parentBinding: newBinding });

                    // result.subscribe(newBinding);
                    newBinding.update(result);

                    var insertAt = startInsertAt + idx;
                    if (insertAt < target.childNodes.length) {
                        var beforeElement = target.childNodes[insertAt];
                        target.insertBefore(newBinding.dom, beforeElement);
                    } else {
                        target.appendChild(newBinding.dom);
                    }
                    bindings.push(newBinding);
                }
            });

            return bindings;
        }
    }

    export function app(...libs: any[]) {
        return new Application(libs);
    };

    // ReSharper restore InconsistentNaming
}