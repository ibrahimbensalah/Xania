class Binding {
    private data;
    public dirty: boolean;
    public parent: TagBinding;

    constructor(public context, private idx: number) {
    }

    public static executeAsync(tpl, context, resolve: any) {
        const model = !!tpl.modelAccessor ? tpl.modelAccessor(context) : context,
            iter = data => {
                Xania.map(resolve, data);
            }
        if (typeof (model.then) === "function") {
            model.then(iter);
        } else {
            iter(model);
        }
    }

    update() {
        throw new Error("Abstract method Binding.update");
    }

    init(depGraph: DependencyGraph) {
        throw new Error("Abstract method Binding.update");
    }

    static create(tpl, context, depGraph: DependencyGraph) {
        var results = [];
        Binding.createAsync(tpl, context, depGraph).then(results.push.bind(results));
        return results;
    }

    static createAsync(tpl: IDomTemplate, context, depGraph: DependencyGraph) {
        return {
            then(resolve) {
                Binding.executeAsync(tpl, context, (model, idx) => {
                    if (typeof idx == "undefined")
                        throw new Error("model idx is not defined");
                    resolve(tpl.bind(model, idx).init(depGraph));
                });
            }
        };
    }

    accept(visitor: Function) {
        var stack = [this];
        while (stack.length > 0) {
            var cur = stack.pop();
            visitor(cur);

            if (cur instanceof TagBinding) {
                let children = cur.children;
                for (var i = 0; i < children.length; i++)
                    stack.push(children[i]);
            }
        }
    }
}

class DependencyGraph {
    private map = new Map<any, any>();

    add(object: any, property: string, binding: Binding) {
        if (this.map.has(object)) {
            const deps = this.map.get(object);

            if (deps.hasOwnProperty(property))
                deps[property].push(binding);
            else
                deps[property] = [binding];
        } else {
            const deps = {};
            deps[property] = [binding];
            this.map.set(object, deps);
        }

        return this;
    }

    get(object: any, property: string) {
        if (!this.map.has(object))
            return [];

        const deps = this.map.get(object);
        const result: Binding[] = [];

        if (deps.hasOwnProperty(property))
            result.push.apply(result, deps[property]);

        return result;
    }

    observer(binding: Binding = null): IObserver {
        var self = this;
        return {
            setRead(obj, property) {
                if (!!binding)
                    self.add(obj, property, binding);
            },
            setChange(obj, property: string) {
                var bindings = self.get(obj, property);
                for (var i = 0; i < bindings.length; i++) {
                    bindings[i].dirty = true;
                }
            }
        };
    }
}

class ContentBinding extends Binding {
    private dom;

    constructor(private tpl: TextContent, context, idx: number) {
        super(context, idx);
    }

    update() {
        if (this.dirty) {
            this.dom.textContent = this.tpl.execute(this.context);
            this.dirty = false;
        }
    }

    init(depGraph: DependencyGraph) {
        var observable = Xania.observe(this.context, depGraph.observer(this));

        var text = this.tpl.execute(observable);
        this.dom = document.createTextNode(text);

        return this;
    }
}

class TagBinding extends Binding {

    public children: Binding[] = [];
    protected dom: HTMLElement;

    constructor(private tpl: TagElement, context, idx: number) {
        super(context, idx);
    }

    private renderTag(model) {
        const elt = document.createElement(this.tpl.name);

        var attributes = this.tpl.executeAttributes(model);
        for (let attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                const domAttr = document.createAttribute(attrName);
                domAttr.value = attributes[attrName];
                elt.setAttributeNode(domAttr);
            }
        }

        return elt;
    }

    update() {
        if (this.dirty) {
            var elt = this.dom;

            var attributes = this.tpl.executeAttributes(this.context);
            for (let attrName in attributes) {
                if (attributes.hasOwnProperty(attrName)) {
                    const domAttr = elt.attributes[attrName];
                    if (!!domAttr) {
                        domAttr.value = attributes[attrName];
                        elt.setAttributeNode(domAttr);
                    }
                }
            }
            this.dirty = false;
        }
    }

    init(depGraph: DependencyGraph) {
        var observable = Xania.observe(this.context, depGraph.observer(this));
        this.dom = this.renderTag(observable);

        const children = this.tpl.children();
        for (var e = 0; e < children.length; e++) {
            Binding.createAsync(children[e], this.context, depGraph)
                .then(child => {
                    child.parent = this;
                    this.dom.appendChild(child.dom);
                    this.children.push(child);
                });
        }
        return this;
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

    parseAttr(tagElement: TagElement, attr: Attr) {
        const name = attr.name;
        if (name === "click") {
            const fn = new Function("m", `with(m) { return ${attr.value}; }`);
            tagElement.addEvent("click", fn);
        } else if (name === "data-for" || name === "data-from") {
            tagElement.for(attr.value, this.import);
        } else {
            const tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    }

    bind(rootDom, model, target) {
        target = target || document.body;
        var tpl = this.parseDom(rootDom);

        var rootBindings: Binding[] = [];
        var depGraph = new DependencyGraph();

        Binding.createAsync(tpl, model, depGraph)
            .then((rootBinding: Binding) => {
                rootBindings.push(rootBinding);
                target.appendChild((<any>rootBinding).dom);
            });


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
        target.addEventListener("click",
            evt => {
                var pathIdx = evt.path.indexOf(target);
                if (pathIdx > 0) {
                    var domPath = evt.path.splice(0, pathIdx);

                    var bindingPath = find(rootBindings, domPath);
                    if (bindingPath.length > 0) {
                        var b = bindingPath.pop();
                        var handler = b.tpl.events.get('click');
                        if (!!handler) {
                            var proxy = Xania.observe(b.context, depGraph.observer());
                            handler(proxy);

                            this.updateBindings(rootBindings);
                        }
                    }
                }
            });

        const onchange = evt => {
            var pathIdx = evt.path.indexOf(target);
            if (pathIdx > 0) {
                const elementPath = evt.path.splice(0, pathIdx);

                var bindingPath = find(rootBindings, elementPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    const nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        const proxy = Xania.observe(b.context, depGraph.observer());
                        const prop = nameAttr.value;
                        const update = new Function("context", "value",
                            `with (context) { ${prop} = value; }`);
                        update(proxy, evt.target.value);

                        this.updateBindings(rootBindings);
                    }
                }
            }
        };
        target.addEventListener("keyup", onchange);
    }

    updateBindings(bindings: Binding[]) {
        for (var i = 0; i < bindings.length; i++) {
            bindings[i].accept(b => b.update());
        }
    }

    parseDom(rootDom: HTMLElement): TagElement {
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
                const template = new TagElement(elt.tagName);

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
                push(new TextContent(tpl || node.textContent));
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
        var params = "";
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, (a, b) => {
            var paramIdx = `arg${params.length}`;
            params += `var ${paramIdx} = ${b};`;
            return `" + ${paramIdx} + "`;
        });

        if (params.length > 0) {
            if (!TemplateEngine.cacheFn[input]) {
                const functionBody = `with(m) {${params}return "${returnExpr}"}`;
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return () => returnExpr;
    }
}
