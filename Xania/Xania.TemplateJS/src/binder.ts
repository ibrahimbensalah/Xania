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
            state(name, value) {
                this.setRead(observer.state, name);
                if (value === undefined) {
                    return observer.state[name];
                } else {
                    return observer.state[name] === value;
                }
            },
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

    track(context) {
        var observer = this;
        return Xania.observe(context,
            {
                state(name, value) {
                    if (value !== undefined) {
                        this.setChange(observer.state, name);
                        observer.state[name] = value;
                    }
                },
                setRead() {
                    // ignore
                },
                setChange(obj, property: string) {
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
        console.debug("dirty size", this.dirty.size);
        this.dirty.forEach(subscriber => {
            subscriber.notify();
        });
        this.dirty.clear();
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
            const fn = this.compile(attr.value);
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
                        },
                            result,
                            binding.dom);

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
                            model = Xania.unwrap(model);
                            return visitArray(Array.isArray(model) ? model : [model]);
                        });
                } else {
                    return visitArray([null]);
                }
            });
        };
        visit(null, rootContext, rootTpl, rootTarget, 0);
    }

    bind(content, model, target) {
        target = target || document.body;
        for (var i = content.childNodes.length - 1; i >= 0; i--) {
            var tpl = this.parseDom(content.childNodes[i]);
            this.bindTemplate(tpl, model, target);
        }

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

    bindTemplate(tpl, model, target) {
        const arr = Array.isArray(model) ? model : [model];
        for (let i = 0; i < arr.length; i++) {
            this.execute(arr[i], tpl, target);
        }
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
        var returnExpr = template.replace(/@([\w\(\)\.,=!']+)/gim, (a, b) => {
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
