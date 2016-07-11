class Binding {
    private data;
    public deps = new Map<any, string[]>();
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

    init() {
        throw new Error("Abstract method Binding.update");
    }

    static create(tpl, context) {
        var results = [];
        Binding.createAsync(tpl, context).then(results.push.bind(results));
        return results;
    }

    static createAsync(tpl: IDomTemplate, context) {
        return {
            then(resolve) {
                Binding.executeAsync(tpl, context, (model, idx) => {
                    if (typeof idx == "undefined")
                        throw new Error("model idx is not defined");
                    resolve(tpl.bind(model, idx).init());
                });
            }
        };
    }

    dependsOn(context, prop: string) {
        if (this.deps.has(context)) {
            console.log(prop);
            if (prop === null)
                return true;

            return this.deps.get(context).indexOf(prop) >= 0;
        }
        return false;
    }
}

class ContentBinding extends Binding {
    private dom;

    constructor(private tpl: TextContent, context, idx: number) {
        super(context, idx);
    }

    update() {
        this.dom.textContent = this.tpl.execute(this.context);
    }

    init() {
        var observable = Xania.observe(this.context, this.deps);

        var text = this.tpl.execute(observable);
        this.dom = document.createTextNode(text);
        return this;
    }
}

class TagBinding extends Binding {

    public children: Binding[] = [];
    protected dom;

    constructor(private tpl: TagElement, context, idx: number) {
        super(context, idx);
    }

    private renderTag() {
        var elt = document.createElement(this.tpl.name);

        var attributes = this.tpl.executeAttributes(this.context);
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
    }

    init() {
        this.dom = this.renderTag();
        const children = this.tpl.children();
        for (var e = 0; e < children.length; e++) {
            Binding.createAsync(children[e], this.context)
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

        var rootBindings = [];
        Binding.createAsync(tpl, model)
            .then(rootBinding => {
                rootBindings.push(rootBinding);
                target.appendChild(rootBinding.dom);
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
                            // var deps = new Map<;
                            // var observable = Xania.observe(b.context, deps);
                            handler(b.context);
                            // console.log(deps);
                            this.updateAll(rootBindings, b.context, null);
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
                        const prop = nameAttr.value;
                        const update = new Function("context", "value",
                            `with (context) { ${prop} = value; }`);
                        update(b.context, evt.target.value);
                        this.updateAll(rootBindings, b.context, prop);
                    }
                }
            }
        };
        target.addEventListener("keyup", onchange);
    }

    updateAll(rootBindings: Binding[], context: any, prop: string) {
        var stack: Binding[] = [];
        stack.push.apply(stack, rootBindings);

        while (stack.length > 0) {
            var current = stack.pop();

            if (current.dependsOn(context, prop))
                current.update();

            if (current instanceof TagBinding) {
                var tag = <TagBinding>current;
                stack.push.apply(stack, tag.children);
            }
        }
    }

    updateFamily(b: TagBinding, prop: string) {
        do {
            for (var i = 0; i < b.children.length; i++) {
                const child = b.children[i];

                //if (child instanceof ContentBinding && child.dependsOn(prop)) {
                //    child.update();
                //}
            }
            b = b.parent;
        } while (b.parent);
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
