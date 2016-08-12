class Binding {
    private data;
    public parent: TagBinding;
    public destroyed = false;

    constructor(public context) {
    }

    init(observer: Observer): Binding {
        throw new Error("Abstract method Binding.update");
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
            this.subscriptions.set(object, deps);
            deps[property] = new Set<ISubsriber>().add(subsriber);
            return true;
        }

        return false;
    }

    get(object: any, property: string) {
        if (!this.subscriptions.has(object))
            return [];

        const deps = this.subscriptions.get(object);

        if (deps.hasOwnProperty(property))
            return deps[property];

        return null;
    }

    unsubscribe(subscription) {
        while (subscription.dependencies.length > 0) {
            var dep = subscription.dependencies.pop();

            if (!this.subscriptions.has(dep.obj))
                debugger;

            const deps = this.subscriptions.get(dep.obj);

            if (!deps.hasOwnProperty(dep.property))
                debugger;

            if (!deps[dep.property].has(subscription))
                debugger;

            deps[dep.property].delete(subscription);
        }
    }

    subscribe(context, update, ...additionalArgs) {
        var self = this,
            // ReSharper disable once JoinDeclarationAndInitializerJs
            observable: Object | void,
            // ReSharper disable once JoinDeclarationAndInitializerJs
            updateArgs: (Object | void)[];

        var subscription = {
            state: null,
            dependencies: [],
            notify() {
                self.unsubscribe(this);
                Xania.ready(this.state || null)
                    .then(s => this.state = update.apply(subscription, updateArgs.concat([s])));
            },
            then(resolve) {
                // TODO implement async
                return Xania.ready(this.state).then(resolve);
            }
        };
        observable = Xania.observe(context, {
            setRead(obj, property) {
                var init = self.size;
                console.debug("read", { obj, property });
                if (self.add(obj, property, subscription)) {
                    var end = self.size;
                    if (end !== init + 1)
                        debugger;

                    subscription.dependencies.push({ obj, property });
                }
            },
            setChange(obj, property: string) {
                throw new Error("invalid change");
            }
        });
        updateArgs = [observable].concat(additionalArgs);
        subscription.notify();

        return subscription;
    }

    track(context) {
        var observer = this;
        return Xania.observe(context,
            {
                setRead() {
                    // ignore
                },
                setChange(obj, property: string) {
                    console.debug("write", obj, property, obj[property]);
                    const subscribers = observer.get(obj, property);
                    if (!!subscribers) {
                        subscribers.forEach(s => {
                            observer.dirty.add(s);
                        });
                    }
                }
            });
    }

    update() {
        window.requestAnimationFrame(() => {
            this.dirty.forEach(subscriber => {
                subscriber.notify();
            });
            this.dirty.clear();
        });

        console.debug("total subscriptions", this.size);
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

    constructor(private tpl: TextTemplate, context) {
        super(context);

        this.dom = document.createTextNode("");
    }

    update(context) {
        this.dom.textContent = this.tpl.execute(context);
    }

    init(observer: Observer) {
        const update = context => {
            this.update(context);
        };
        observer.subscribe(this.context, update);
        return this;
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

    update(context) {
        const tagBinding = this;

        var elt = tagBinding.dom;

        var attributes = tagBinding.tpl.executeAttributes(context);
        for (let attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var newValue = Xania.join(" ", attributes[attrName]);
                var oldValue = elt[attrName];
                if (oldValue === newValue)
                    continue;

                elt[attrName] = newValue;
                if (typeof newValue === "undefined" || newValue === null) {
                    elt.removeAttribute(attrName);
                } else if (attrName === "value") {
                    elt["value"] = newValue;
                } else {
                    let domAttr = elt.attributes[attrName];
                    if (!!domAttr) {
                        domAttr.nodeValue = newValue;
                        domAttr.value = newValue;
                    } else {
                        domAttr = document.createAttribute(attrName);
                        domAttr.value = newValue;
                        elt.setAttributeNode(domAttr);
                    }
                }
            }
        }
    }

    render(context) {
        const tpl = this.tpl;
        const dom = this.dom;

        const attributes = tpl.executeAttributes(context);
        for (let attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                const newValue = Xania.join(" ", attributes[attrName]);
                const oldValue = dom[attrName];
                if (oldValue === newValue)
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
    }

    init(observer: Observer = new Observer()) {
        const update = (context, tagBinding: TagBinding) => {
            if (tagBinding.destroyed)
                return;

            if (!!tagBinding.dom)
                console.debug("update tag", tagBinding.dom);

            tagBinding.update(context);
        };

        return this;
    }

    initChildren(observer: Observer) {
        const updateChild = (context, tagBinding: TagBinding, tpl, state) => {
            const modelAccessor: any = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;
            var r = modelAccessor(this.context);

            var elements = [];
            if (!!state) {
                elements = state.elements;
            }

            Xania.ready(r).then(model => {
                model = Xania.unwrap(model);
                var arr = Array.isArray(model) ? model : [model];

                for (var i = 0; i < arr.length; i++) {
                    const result = Xania.assign({}, context.valueOf(), arr[i]);
                    const child = tpl.bind(result).init(observer);

                    tagBinding.dom.appendChild(child.dom);
                    tagBinding.children.push(child);
                }
            });

            return { elements };
        }

        this.tpl.children().forEach(tpl => {
            observer.subscribe(this.context, updateChild, this, tpl);
        });
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

    constructor(public compile: Function = TemplateEngine.compile) {
    }

    public import(itemType) {
        if (typeof itemType == "undefined")
            return null;

        switch (typeof (itemType)) {
            case "string":
                return window[itemType];
            case "function":
                return itemType;
            default:
                return null;
        }
    }

    parseAttr(tagElement: TagTemplate, attr: Attr) {
        const name = attr.name;
        if (name === "click" || name.startsWith("keyup.")) {
            const fn = new Function("m", `with(m) { return ${attr.value}; }`);
            tagElement.addEvent(name, fn);
        } else if (name === "data-for" || name === "data-from") {
            tagElement.for(attr.value, this.import);
        } else if (name === "checked") {
            const fn = this.compile(attr.value);
            tagElement.attr(name, Xania.compose(ctx => !!ctx ? "checked" : null, fn));
        } else {
            const tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    }


    static execute(rootContext, rootTpl, rootTarget, observer: Observer) {
        var visit = (context, tpl, target, offset: number) => {
            var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;

            return observer.subscribe(context, (observable, state) => {
                console.log("update", { context, tpl, target, state });

                return Xania.ready(modelAccessor(observable))
                    .then(model => {
                        model = Xania.unwrap(model);
                        return Array.isArray(model) ? model : [model];
                    })
                    .then(arr => {
                        var nextBindings = [];
                        var prevLength = !!state && state.length || 0;
                        var prevBindings = !!state && state.bindings || [];

                        for (let n = 0; n < arr.length; n++) {
                            var key = arr[n];
                            console.debug("bind key", key);
                        }

                        for (let i = prevLength; i < arr.length; i++) {
                            const result = Xania.assign({}, context, arr[i]);
                            var binding = tpl.bind(result);

                            nextBindings.push(binding);

                            const idx = offset + i;
                            if (idx < target.childNodes.length)
                                target.insertBefore(binding.dom, target.childNodes[idx]);
                            else
                                target.appendChild(binding.dom);

                            observer.subscribe(result, binding.render.bind(binding));

                            const visitChild = Xania.partialApp((data, target, prev, cur) => {
                                    return Xania.ready(prev)
                                        .then(p => {
                                            return visit(data, cur, target, p)
                                                .then(x => p + x.length);
                                        });
                                },
                                result,
                                binding.dom);

                            tpl.children().reduce(visitChild, 0);
                        }

                        for (let e = prevLength - 1; e >= arr.length; e--) {
                            const idx = offset + e;
                            target.removeChild(target.childNodes[idx]);
                        }

                        return { length: arr.length, bindings: nextBindings };
                    });
            });
        };
        visit(rootContext, rootTpl, rootTarget, 0);
    }

    bind(rootDom, model, target) {
        target = target || document.body;
        var tpl = this.parseDom(rootDom);

        const arr = Array.isArray(model) ? model : [model];
        for (let i = 0; i < arr.length; i++) {
            Binder.execute(arr[i], tpl, target, this.observer);
        }

        var eventHandler = (target, name, path) => {
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

        target.addEventListener("click", evt => eventHandler(evt.target, evt.type, evt.path));

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
                eventHandler(evt.target, "keyup.enter", evt.path);
            } else {
                onchange(evt);
            }
            this.observer.update();
        });
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

            if (node.nodeType === 1) {
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
}

class TemplateEngine {
    private static cacheFn: any = {};

    static compile(input) {
        if (!input || !input.trim()) {
            return null;
        }

        var template = input.replace(/\n/g, "\\\n");
        var decl = [];
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, (a, b) => {
            var paramIdx = `arg${decl.length}`;
            decl.push(b);
            return `"+${paramIdx}+"`;
        });

        if (returnExpr === '"+arg0+"') {
            if (!TemplateEngine.cacheFn[input]) {
                const functionBody = `with(m) {return ${decl[0]};}`;
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        } else if (decl.length > 0) {
            var params = decl.map((v, i) => `var arg${i} = ${v}`).join(";");
            if (!TemplateEngine.cacheFn[input]) {
                const functionBody = `with(m) {${params};return "${returnExpr}"}`;
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return () => returnExpr;
    }
}
