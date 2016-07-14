﻿class Binding {
    private data;
    public observer = new Observer();
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

    accept(visit: Function) {
        var stack = [this];
        while (stack.length > 0) {
            var cur = stack.pop();
            visit(cur);

            if (cur instanceof TagBinding) {
                let children = (<TagBinding>cur).children;
                for (var i = 0; i < children.length; i++)
                    stack.push(children[i]);
            }
        }
    }

    dependencies() {
        return this.observer.reads;
    }

    dependsOn(context, prop: string) {
        return this.observer.hasRead(context, prop);
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
        var observable = Xania.observe(this.context, this.observer);

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

        var rootBindings: Binding[] = [];
        const map = new Map<any, [Binding]>();
        Binding.createAsync(tpl, model)
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
                            var observer = new Observer();
                            var proxy = Xania.observe(b.context, observer);
                            handler(proxy);
                            this.updateAll(rootBindings, observer.changes);
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
                        var observer = new Observer();
                        var proxy = Xania.observe(b.context, observer);
                        const prop = nameAttr.value;
                        const update = new Function("context", "value",
                            `with (context) { ${prop} = value; }`);
                        update(proxy, evt.target.value);
                        for (var i = 0; i < 10000; i++) {
                            this.updateAll(rootBindings, observer.changes);
                        }
                    }
                }
            }
        };
        target.addEventListener("keyup", onchange);
    }

    updateAll(rootBindings: Binding[], changes: Map<any, string[]>) {
        if (!(<any>window).__map) {
            (<any>window).__map = new Map<any, [Binding]>();
            for (let n = 0; n < rootBindings.length; n++) {
                rootBindings[n].accept((b: Binding) => {
                    b.dependencies().forEach((props, obj) => {
                        if ((<any>window).__map.has(obj))
                            (<any>window).__map.get(obj).push(b);
                        else
                            (<any>window).__map.set(obj, [b]);
                    });
                });
            }
        }
        const map = (<any>window).__map;

        changes.forEach((props, obj) => {
            if (map.has(obj)) {
                const bindings = map.get(obj);
                for (let e = 0; e < bindings.length; e++) {
                    const binding = bindings[e];
                    for (let i = 0; i < props.length; i++) {
                        if (binding.dependsOn(obj, props[i])) {
                            binding.update();
                            break;
                        }
                    }
                }
            }
        });
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
