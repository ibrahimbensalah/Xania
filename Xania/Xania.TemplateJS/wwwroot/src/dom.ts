/// <reference path="template.ts" />
/// <reference path="store.ts" />
/// <reference path="zone.ts" />
/// <reference path="core.ts" />
/// <reference path="fun.ts" />
module Xania {
    export module Dom {

        class DomBinding implements Data.ISubscriber {
            public state;
            protected context;
            private subscriptions: any[] = [];
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

        export class ContentBinding extends DomBinding {

            constructor() {
                super();
                this.dom = document.createDocumentFragment();
            }

            render() {
                return this.dom;
            }
        }

        export class TextBinding extends DomBinding {

            constructor(private modelAccessor, context) {
                super();
                this.dom = (<any>document).createTextNode("");
                this.context = context;
            }

            render(context) {
                const newValue = this.modelAccessor.execute(context, this);

                if (!!newValue && !!newValue.onNext) {
                    newValue.subscribe(this);
                } else {
                    this.onNext(newValue.valueOf());
                }
            }

            onNext(newValue) {
                this.dom.textContent = newValue;
            }
        }

        export class TagBinding extends DomBinding {
            private attributeBindings = [];

            constructor(name: string, private ns: string, attributes: { name; tpl }[], private events) {
                super();
                if (ns === null)
                    this.dom = document.createElement(name);
                else {
                    this.dom = (<any>document).createElementNS(ns, name.toLowerCase());
                }

                this.dom.attributes["__binding"] = this;

                var classBinding = new ClassBinding(this);
                const length = attributes.length;
                for (var i = 0; i < length; i++) {
                    var attr = attributes[i];

                    var attrTpl = attr.tpl;
                    var attrName = attr.name;

                    if (attrName === "class") {
                        classBinding.setBaseClass(attrTpl);
                    } else if (attrName.startsWith("class.")) {
                        classBinding.addClass(attrName.substr(6), attrTpl);
                    } else {
                        var attrBinding = new AttributeBinding(this, attrName, attrTpl);
                        this.attributeBindings.push(attrBinding);
                    }
                };
                this.attributeBindings.push(classBinding);
            }

            render(context) {
                for (var i = 0; i < this.attributeBindings.length; i++) {
                    this.attributeBindings[i].render(context);
                }
                return this.dom;
            }

            trigger(name) {
                var handler = this.events.get(name);
                if (!!handler) {
                    var result = handler.execute(this.context, {
                        get(obj, name) {
                            return obj.get(name);
                        },
                        set(obj: any, name: string, value: any) {
                            obj.get(name).set(value);
                        },
                        invoke(_, fn, args) {
                            if (!!fn.invoke) {
                                var xs = args.map(x => x.valueOf());
                                return fn.invoke(xs);
                            }
                            return fn;
                        }
                    });

                    if (!!result && typeof result.value === "function")
                        result.invoke();
                }
            }
        }

        export class ClassBinding extends DomBinding {
            private conditions = [];
            private oldValue;
            private baseClassTpl;

            constructor(private parent: TagBinding) {
                super();
            }

            setBaseClass(tpl) {
                this.baseClassTpl = tpl;
            }

            addClass(className, condition) {
                this.conditions.push({ className, condition });
            }

            render(context) {
                this.context = context;
                const classes = [];
                if (!!this.baseClassTpl) {
                    var value = this.baseClassTpl.execute(context, this).valueOf();
                    classes.push(value);
                }

                for (var i = 0; i < this.conditions.length; i++) {
                    var { className, condition } = this.conditions[i];
                    if (!!condition.execute(context, this).valueOf()) {
                        classes.push(className);
                    }
                }

                this.setAttribute("class", classes.length > 0 ? join(" ", classes) : null);
            }

            public setAttribute(attrName: string, newValue) {
                var oldValue = this.oldValue;

                var tag = this.parent.dom;
                if (typeof newValue === "undefined" || newValue === null) {
                    tag[attrName] = void 0;
                    tag.removeAttribute(attrName);
                } else {
                    if (typeof oldValue === "undefined") {
                        var attr = document.createAttribute(attrName);
                        attr.value = newValue;
                        tag.setAttributeNode(attr);
                    } else {
                        tag.className = newValue;
                    }
                }
                this.oldValue = newValue;
            }

        }

        export class AttributeBinding extends DomBinding {
            private oldValue;

            constructor(private parent : TagBinding, private name, private tpl) {
                super();
            }

            render(context) {
                this.context = context;
                var value = this.tpl.execute(context, this);

                if (!!value && !!value.onNext) {
                    value.subscribe(this);
                } else {
                    this.onNext(value);
                }
            }

            public onNext(value) {
                if (value !== null && value !== void 0 && !!value.valueOf)
                    value = value.valueOf();

                var newValue;
                if (this.name === "checked") {
                    newValue = !!value ? "checked" : null;
                } else {
                    newValue = value;
                }

                var oldValue = this.oldValue;

                var attrName = this.name;
                var tag = this.parent.dom;
                if (typeof newValue === "undefined" || newValue === null) {
                    tag[attrName] = void 0;
                    tag.removeAttribute(attrName);
                } else {
                    if (typeof oldValue === "undefined") {
                        var attr = document.createAttribute(attrName);
                        attr.value = newValue;
                        tag.setAttributeNode(attr);
                    } else {
                        tag.setAttribute(attrName, newValue);
                    }
                }
                this.oldValue = newValue;
            }
        }

        class ReactiveBinding extends DomBinding {
            private bindings = [];
            private stream;
            private length;

            constructor(private tpl: Template.INodeTemplate, private target, private offset) {
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

        export function executeTemplate(observable, tpl: Template.INodeTemplate, target, offset) {
            return new ReactiveBinding(tpl, target, offset).update(observable);
        }

        class Binder {
            private compile: Function;
            private compiler: Ast.Compiler;
            public contexts: Data.IValue[] = [];

            constructor(private libs: any[]) {
                this.compiler = new Ast.Compiler();
                this.compile = this.compiler.template.bind(this.compiler);
            }

            static listen(target, store: Data.Store) {
                var eventHandler = (target, name) => {
                    var binding = target.attributes["__binding"];
                    if (!!binding) {
                        binding.trigger(name);
                        store.update();
                    }
                };

                target.addEventListener("click", evt => eventHandler(evt.target, evt.type));

                const onchange = evt => {
                    var binding = evt.target.attributes["__binding"];
                    if (binding != null) {
                        const nameAttr = evt.target.attributes["name"];
                        if (!!nameAttr) {
                            var arr = nameAttr.value.split('.');
                            var context = binding.context;
                            for (var i = 0; i < arr.length; i++) {
                                var p = arr[i];
                                context = context.get(p);
                            }
                            context.set(evt.target.value);

                            store.update();
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
                    });
                target.addEventListener("mouseover",
                    evt => {
                        eventHandler(evt.target, "mouseover");
                    }
                );
                target.addEventListener("mouseout",
                    evt => {
                        eventHandler(evt.target, "mouseout");
                    }
                );
            }

            public update2() {
                for (let i = 0; i < this.contexts.length; i++) {
                    var ctx = this.contexts[i];
                    ctx.update(null);
                }
            }

            parseDom(rootDom: Node): Template.INodeTemplate {
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
                        const elt = <HTMLElement>node["content"];
                        var template = new Template.ContentTemplate();
                        for (i = elt.childNodes.length - 1; i >= 0; i--) {
                            stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                        }
                        push(template);
                    } else if (node.nodeType === 1) {
                        const elt = <HTMLElement>node;
                        const template = new Template.TagTemplate(elt.tagName, elt.namespaceURI);

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
                            push(new Template.TextTemplate(tpl || node.textContent));
                        }
                    }
                }

                return rootTpl;
            }

            parseAttr(tagElement: Template.TagTemplate, attr: Attr) {
                const name = attr.name;
                if (name === "click" || name.match(/keyup\./) || name === "mouseover" || name === "mouseout") {
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
                        !tagElement.getAttribute("value")) {
                        const valueAccessor = this.compile(`{{ ${attr.value} }}`);
                        tagElement.attr("value", valueAccessor);
                    }
                }
            }

        }

        export function importView(view: string, ...args): any {
            if (!("import" in document.createElement("link"))) {
                throw new Error("HTML import is not supported in this browser");
            }

            var deferred = {
                value: void 0,
                resolvers: [],
                notify(value) {
                    this.value = value;
                    for (var i = 0; i < this.resolvers.length; i++) {
                        var resolver = this.resolvers[i];
                        resolver.apply(this, [this.value].concat(args));
                    }
                },
                then(resolve) {
                    if (this.value !== void 0) {
                        resolve.apply(this, [this.value].concat(args));
                    } else {
                        this.resolvers.push(resolve);
                    }
                }
            };
            var link = document.createElement('link');
            link.rel = 'import';
            link.href = view;
            link.setAttribute('async', ""); // make it async!
            link.onload = e => {
                var link = (<any>e.target);
                deferred.notify(link.import.querySelector("template"));
            }
            document.head.appendChild(link);

            return deferred;
        }

        function defer() {
            return {
                value: void 0,
                resolvers: [],
                notify(value) {
                    if (value === void 0)
                        throw new Error("undefined result");

                    this.value = value;

                    for (var i = 0; i < this.resolvers.length; i++) {
                        this.resolvers[i].call(null, value);
                    }
                },
                then(resolve) {
                    if (this.value === void 0) {
                        this.resolvers.push(resolve);
                    } else {
                        resolve.call(null, this.value);
                    }
                }
            };
        }

        export function bind(dom: Node, store) {

            var binder = new Binder([Xania.Core.List, Xania.Core.Math, Xania.Core.Dates]);

            let fragment = document.createDocumentFragment();
            Dom.executeTemplate(store, binder.parseDom(dom), fragment, 0);
            for (var i = 0; i < fragment.childNodes.length; i++) {
                var child = fragment.childNodes[i];
                Binder.listen(child, store);
            }

            return fragment;
        }
    }

    export function ready(data, resolve) {

        if (data !== null && data !== void 0 && !!data.then)
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
