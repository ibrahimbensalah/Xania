module Xania {
    export module Dom {
        class DomBinding implements Data.ISubscriber {
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
                this.dom = document.createTextNode("");
                this.context = context;
            }

            render(context) {
                var binding = this;
                const newValue = this.modelAccessor.execute(context, this);

                if (!!newValue && !!newValue.subscribe) {
                    newValue.subscribe({
                        onNext(v) {
                            binding.setText(v);
                        }
                    });
                } else {
                    this.setText(newValue.valueOf());
                }
            }

            setText(newValue) {
                this.dom.textContent = newValue;
            }

        }

        export class TagBinding extends DomBinding {
            protected attrs = {};
            private mutationId;
            constructor(name: string, private ns: string, private attributes: { name: string; tpl }[], private events: Map<string, any>) {
                super();
                if (ns === null)
                    this.dom = document.createElement(name);
                else {
                    this.dom = document.createElementNS(ns, name.toLowerCase());
                }

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
                                dom.setAttribute(attrName, newValue);
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
                value: undefined,
                resolvers: [],
                notify(value) {
                    this.value = value;
                    for (var i = 0; i < this.resolvers.length; i++) {
                        var resolver = this.resolvers[i];
                        resolver.apply(this, [this.value].concat(args));
                    }
                },
                then(resolve) {
                    if (this.value !== undefined) {
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
                value: undefined,
                resolvers: [],
                notify(value) {
                    if (value === undefined)
                        throw new Error("undefined result");

                    this.value = value;

                    for (var i = 0; i < this.resolvers.length; i++) {
                        this.resolvers[i].call(null, value);
                    }
                },
                then(resolve) {
                    if (this.value === undefined) {
                        this.resolvers.push(resolve);
                    } else {
                        resolve.call(null, this.value);
                    }
                }
            };
        }

        export function bind(dom: Node, store) {

            var binder = new Binder([Core.List, Core.Math, Core.Dates]);

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
