interface ISubsriber {
    notify();
}

class BindingContext {
    constructor(private tpl, private context, private addChild) {
    }

    static update(target, modelAccessor: Function, resolve) {
        const model = modelAccessor(target);
        if (typeof (model.then) === "function") {
            model.then(resolve);
        } else {
            resolve(model, 0);
        }
    }

    execute(observer: Observer, offset: number) {
        var context = this.context;
        var tpl = this.tpl;
        var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;

        observer.subscribe(context, BindingContext.update, modelAccessor, (model, idx) => {
            if (typeof idx == "undefined")
                throw new Error("model idx is not defined");

            var result = Xania.assign({}, context, model);

            var child = tpl.bind(result, idx).init(observer);
            this.bindings.push(child);
            this.addChild(child, idx, offset);
        });
    }

    bindings: Binding[] = [];
}

class Binding {
    private data;
    public parent: TagBinding;

    constructor(public context, private idx: number) {
    }

    init(observer: Observer): Binding {
        throw new Error("Abstract method Binding.update");
    }

    addChild(child, idx) {
        throw new Error("Abstract method Binding.update");
    }
}

class Observer {
    private subscriptions = new Map<any, any>();
    private dirty = new Set<ISubsriber>();

    add(object: any, property: string, subsriber: ISubsriber) {
        if (this.subscriptions.has(object)) {
            const deps = this.subscriptions.get(object);

            if (deps.hasOwnProperty(property)) {
                if (deps[property].indexOf(subsriber) < 0)
                    deps[property].push(subsriber);
            } else
                deps[property] = [subsriber];
        } else {
            const deps = {};
            deps[property] = [subsriber];
            this.subscriptions.set(object, deps);
        }

        return this;
    }

    get(object: any, property: string) {
        if (!this.subscriptions.has(object))
            return [];

        const deps = this.subscriptions.get(object);
        const result: ISubsriber[] = [];

        if (deps.hasOwnProperty(property) || deps.hasOwnProperty("*"))
            result.push.apply(result, deps[property]);

        return result;
    }

    subscribe(context, update, ...additionalArgs) {
        var self = this, observable;
        var subscription = {
            notify() {
                update.apply(this, [observable].concat(additionalArgs));
            }
        };
        observable = Xania.observe(context, {
            setRead(obj, property) {
                console.log("read", obj, property);
                self.add(obj, property, subscription);
            },
            setChange(obj, property: string) {
                throw new Error("invalid change");
            }
        });
        update.apply(this, [observable].concat(additionalArgs));
    }

    //observe(context, subsriber: ISubsriber) {
    //    var self = this;
    //    return Xania.observe(context, {
    //        setRead(obj, property) {
    //            console.log("read", obj, property);
    //            self.add(obj, property, subsriber);
    //        },
    //        setChange(obj, property: string) {
    //            throw new Error("invalid change");
    //        }
    //    });
    //}

    track(context) {
        var self = this;
        return Xania.observe(context,
            {
                setRead() {
                    // ignore
                },
                setChange(obj, property: string) {
                    console.log("write", obj, property);
                    const subscribers = self.get(obj, property);
                    for (let i = 0; i < subscribers.length; i++) {
                        self.dirty.add(subscribers[i]);
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

    constructor(private tpl: TextTemplate, context, idx: number) {
        super(context, idx);
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
}

class TagBinding extends Binding {

    public children: Binding[] = [];
    protected dom: HTMLElement;

    constructor(private tpl: TagTemplate, context, idx: number) {
        super(context, idx);
    }

    init(observer: Observer = new Observer()) {
        var updateTag = (context, tpl) => {
            if (typeof this.dom === "undefined") {
                this.dom = document.createElement(tpl.name);
            }

            var elt = this.dom;

            var attributes = tpl.executeAttributes(context);
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
        };
        observer.subscribe(this.context, updateTag, this.tpl);

        const bindingContexts = this.tpl.children().map(tpl => new BindingContext(tpl, this.context, (child, idx, bcIndex) => {
            var offset = 0;
            for (var i = 0; i < bcIndex; i++) {
                offset += bindingContexts[i].bindings.length;
            }
            this.addChild(child, offset + idx);
        }));

        for (var e = 0; e < bindingContexts.length; e++) {
            bindingContexts[e].execute(observer, e);
        }

        return this;
    }

    addChild(child, idx) {
        child.parent = this;
        this.children.push(child);

        if (idx >= this.dom.childNodes.length) {
            this.dom.appendChild(child.dom);
        } else {
            this.dom.insertBefore(child.dom, this.dom.childNodes[idx]);
        }
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

        var eventHandler =
            (name, path) => {
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
