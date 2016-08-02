interface ISubsriber {
    notify();
}

class BindingContext {
    constructor(private tpl, private context, private addChild) {
    }

    static update(target, modelAccessor: Function, resolve) {
        const model = modelAccessor(target);
        if (typeof (model.then) === "function") {
            model.then.call(this, resolve);
        } else {
            resolve.call(this, model);
        }
    }

    execute(observer: Observer, offset: number) {
        var context = this.context;
        var tpl = this.tpl;
        var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;

        //const itemHandler = (item, idx) => {
        //    var result = {};
        //    item = Xania.unwrap(item);

        //    if (this.items[idx] !== item) {
        //        this.items[idx] = item;

        //        result[this.varName] = typeof viewModel !== "undefined" && viewModel !== null
        //            ? Xania.construct(viewModel, item)
        //            : item;
        //        resolve(result, idx);
        //    }
        //};

        observer.subscribe(context, ctx => {
            Xania.ready(modelAccessor(ctx), model => {
                model = Xania.unwrap(model);
                var arr = Array.isArray(model) ? model : [model];

                var children = [];

                for (var i = 0; i < arr.length; i++) {
                    const result = Xania.assign({}, context, arr[i]);
                    const child = tpl.bind(result).init(observer);

                    children.push(child);
                    this.addChild(child, i);
                }

                return children;
            });
        });

        //observer.subscribe(context, BindingContext.update, modelAccessor, (model) => {
        //    var arr = Array.isArray(model) ? model : [model];
        //    var bindings = [];
        //    for (var i = 0; i < arr.length; i++) {
        //        const model = Xania.unwrap(arr[i]);

        //        const result = Xania.assign({}, context, model);
        //        const child = tpl.bind(result).init(observer);
        //        bindings.push(child);

        //        //for (var i = this.bindings.length - 1; i > i; i--) {
        //        //    this.bindings[i + 1] = this.bindings[i];
        //        //}
        //        // this.bindings[i] = child;
        //        this.addChild(child, i, offset);
        //        // }
        //    }

        //    return { bindings };
        //});
    }

    bindings: Binding[] = [];
}

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
}

class Observer {
    private subscriptions = new Map<any, any>();
    private dirty = new Set<ISubsriber>();

    add(object: any, property: string, subsriber: ISubsriber) {
        if (this.subscriptions.has(object)) {
            const deps = this.subscriptions.get(object);

            if (deps.hasOwnProperty(property)) {
                if (deps[property].indexOf(subsriber) < 0) {
                    deps[property].push(subsriber);
                    return true;
                }
            } else {
                deps[property] = [subsriber];
                return true;
            }
        } else {
            console.debug("observe object", object);
            const deps = {};
            deps[property] = [subsriber];
            this.subscriptions.set(object, deps);
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

        return [];
    }

    remove(object: any, property: string, subscr) {
        if (!this.subscriptions.has(object))
            return false;

        const deps = this.subscriptions.get(object);

        if (deps.hasOwnProperty(property)) {
            deps[property] = deps[property].filter(s => s !== subscr);
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
                for (var i = 0; i < this.dependencies.length; i++) {
                    var dep = this.dependencies[i];
                    self.remove(dep.obj, dep.property, this);
                }
                this.dependencies = [];
                this.state = update.apply(subscription, updateArgs);
            }
        };
        observable = Xania.observe(context, {
            setRead(obj, property) {
                if (self.add(obj, property, subscription))
                    subscription.dependencies.push({ obj, property });
            },
            setChange(obj, property: string) {
                throw new Error("invalid change");
            }
        });
        updateArgs = [observable].concat(additionalArgs);
        subscription.state = update.apply(subscription, [observable].concat(additionalArgs));

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
                    for (let i = 0; i < subscribers.length; i++) {
                        observer.dirty.add(subscribers[i]);
                    }
                }
            });
    }

    update() {
        this.dirty.forEach(subscriber => {
            subscriber.notify();
        });
        this.dirty.clear();
    }
}

class ContentBinding extends Binding {
    private dom;

    constructor(private tpl: TextTemplate, context) {
        super(context);
    }

    init(observer: Observer) {
        const update = context => {
            const text = this.tpl.execute(context);
            if (!!this.dom) {
                this.dom.textContent = text;
            } else {
                this.dom = document.createTextNode(text);
            }
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
}

class TagBinding extends Binding {

    public children: Binding[] = [];
    protected dom: HTMLElement;

    constructor(private tpl: TagTemplate, context) {
        super(context);
    }

    updateTag(context) {
        const tagBinding = this;

        if (typeof tagBinding.dom === "undefined") {
            tagBinding.dom = document.createElement(tagBinding.tpl.name);
        }

        var elt = tagBinding.dom;

        var attributes = tagBinding.tpl.executeAttributes(context);
        for (let attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var attrValue = Xania.join(" ", attributes[attrName]);
                elt[attrName] = attrValue;
                if (typeof attrValue === "undefined" || attrValue === null) {
                    elt.removeAttribute(attrName);
                } else if (attrName === "value") {
                    elt["value"] = attrValue;
                } else {
                    let domAttr = elt.attributes[attrName];
                    if (!!domAttr) {
                        domAttr.nodeValue = attrValue;
                        domAttr.value = attrValue;
                    } else {
                        domAttr = document.createAttribute(attrName);
                        domAttr.value = attrValue;
                        elt.setAttributeNode(domAttr);
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

            tagBinding.updateTag(context);

            for (var i = 0; i < tagBinding.children.length; i++) {
                tagBinding.children[i].destroy();
            }

            tagBinding.tpl.children().map(tpl => {
                var bc = new BindingContext(tpl,
                    this.context,
                    (child) => {
                        //var offset = 0;
                        //for (var i = 0; i < bcIndex; i++) {
                        //    offset += bindingContexts[i].bindings.length;
                        //}
                        tagBinding.children.push(child);
                        tagBinding.dom.appendChild(child.dom);
                        // this.addChild(child);
                    });
                bc.execute(observer, 0);
            });

            console.debug("update complete");
        };
        observer.subscribe(this.context, update, this);

        //this.tpl.children().map(tpl => {
        //    var context = this.context;
        //    var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;

        //    observer.subscribe(context,
        //        BindingContext.update,
        //        modelAccessor,
        //        (member) => {
        //            var arr = Array.isArray(member) ? member : [member];
        //            var bindings: HTMLElement[] = [];
        //            for (let i = 0; i < arr.length; i++) {
        //                const model = Xania.unwrap(arr[i]);

        //                const result = Xania.assign({}, context, model);
        //                const child = tpl.bind(result).init(observer);
        //                bindings.push(child.dom);

        //                this.addChild(child, 0);
        //            }
        //            return bindings;
        //        });

        //}); 

        //for (var e = 0; e < bindingContexts.length; e++) {
        //    bindingContexts[e].execute(observer, e);
        //}

        return this;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);

        // if (idx >= this.dom.childNodes.length) {
        this.dom.appendChild(child.dom);
        // } else {
        //     this.dom.insertBefore(child.dom, this.dom.childNodes[idx]);
        // }
    }

    destroy() {
        if (!!this.dom) {
            this.dom.remove();
        }
        this.destroyed = true;
    }
}

class Binder {

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

    bind(rootDom, model, target) {
        target = target || document.body;
        var tpl = this.parseDom(rootDom);

        var rootBindings: Binding[] = [];
        var observer = new Observer();

        const arr = Array.isArray(model) ? model : [model];
        for (let i = 0; i < arr.length; i++) {
            var bindingContext = new BindingContext(tpl,
                arr[i],
                rootBinding => {
                    rootBindings.push(rootBinding);
                    target.appendChild(rootBinding.dom);
                });
            bindingContext.execute(observer, 0);
        }

        function find(bindings, path) {
            const result = [];

            for (let i = path.length - 1; i >= 0; i--) {
                const dom = path[i];
                var domIdx = 0;
                for (; domIdx < bindings.length; domIdx++) {
                    var binding = bindings[domIdx];
                    if (binding.dom === dom) {
                        result.push(binding);
                        break;
                    }
                }

                if (domIdx === bindings.length) {
                    return [];
                }
                bindings = bindings[domIdx].children;
            }

            return result;
        }

        var eventHandler = (name, path) => {
            var pathIdx = path.indexOf(target);
            if (pathIdx > 0) {
                var domPath = path.splice(0, pathIdx);

                var bindingPath = find(rootBindings, domPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    var handler = b.tpl.events.get(name);
                    if (!!handler) {
                        var observable = observer.track(b.context);
                        handler(observable);
                        observer.update();
                    }
                }
            }
        };

        target.addEventListener("click", evt => eventHandler(evt.type, evt.path));

        const onchange = evt => {
            var pathIdx = evt.path.indexOf(target);
            if (pathIdx > 0) {
                const elementPath = evt.path.splice(0, pathIdx);

                var bindingPath = find(rootBindings, elementPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    const nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        const proxy = observer.track(b.context);
                        const prop = nameAttr.value;
                        const update = new Function("context", "value",
                            `with (context) { ${prop} = value; }`);
                        update(proxy, evt.target.value);
                    }
                }
            }
        };
        target.addEventListener("keyup", evt => {
            if (evt.keyCode === 13) {
                eventHandler("keyup.enter", evt.path);
            } else {
                onchange(evt);
            }
            observer.update();
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
