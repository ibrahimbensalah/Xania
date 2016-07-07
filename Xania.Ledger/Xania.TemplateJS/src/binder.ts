class Binding {
    private data;
    private parent: Binding;

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
}

class ContentBinding extends Binding {
    private dom;
    private deps = [];

    constructor(private tpl: TextContent, context, idx: number) {
        super(context, idx);
    }

    update() {
        this.dom.textContent = this.tpl.execute(this.context);
    }

    init() {
        debugger;
        var deps = [];
        var prx = Xania.observe(this.context, deps);
        var text = this.tpl.execute(prx);

        console.log(this.tpl.toString(), this.context, deps);

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

        var proxy = model;//Util.proxy(model).create();

        var rootBindings = [];
        Binding.createAsync(tpl, proxy)
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
                        bindings = binding.children;
                        break;
                    }
                }

                if (domIdx === bindings.length) {
                    return [];
                }
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
                        if (!!handler)
                            handler(b.context);
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
                    const nameAttr = evt.target.attributes['name'];
                    if (!!nameAttr) {
                        const prop = nameAttr.value;
                        const update = new Function("context", "value",
                            `with (context) { ${prop} = value; }`);

                        update(b.context, evt.target.value);
                    }
                    b.update();
                    // updateChildren(bindingPath.pop(), evt.target.parentNode);
                }
            }
        };
        // target.addEventListener("keypress", onchange);
        target.addEventListener("keyup", onchange);
        // target.addEventListener("keydown", onchange);
         
        //function updateChildren(binding, node) {

        //    var stack = [{ b: binding, node: node }];
        //    while (stack.length > 0) {
        //        var cur = stack.pop();

        //        cur.b.update();

        //        for (let i = 0; i < cur.b.children.length && i < cur.node.childNodes.length; i++) {
        //            const b = cur.b.children[i];
        //            const child = cur.node.childNodes[i];

        //            stack.push({ b: b, node: child });
        //        }
        //    }
        //}

        //return result;
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
        // var returnExpr = template.replace(/@([a-z_][\.a-z0-9_]*)/gim, (a, b) => {
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, function (a, b) {
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
