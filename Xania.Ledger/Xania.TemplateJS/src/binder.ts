class Binding {
    private data;
    public children: Binding[] = [];

    constructor(public tpl: IDomTemplate, public context: any = null) {
    }

    public static executeAsync(tpl, context, resolve: any) {
        const model = !!tpl.modelAccessor ? tpl.modelAccessor(context) : context,
            iter = data => {
                Util.map(resolve, data);
            }
        if (typeof (model.then) === "function") {
            model.then(iter);
        } else {
            iter(model);
        }
    }

    public countElements() {
        return Util.count(this.data);
    }

    init() {
        var result = [];
        this.initAsync({ appendChild: result.push.bind(result) });
        return result;
    }

    update(target) {
        this.tpl.update(target, this.context);
    }

    initAsync(target) {
        Binding.executeAsync(this.tpl, this.context, model => {
            var elt = this.tpl.render(model);
            var childBinding = new Binding(this.tpl, model);
            this.children.push(childBinding);
            for (var e = 0; e < this.tpl.children().length; e++) {
                const child = this.tpl.children()[e];
                const binding = new Binding(child, model);
                this.children.push(binding);

                binding.initAsync(elt);
            }
            target.appendChild(elt);
        });
    }

    static createAsync(tpl: IDomTemplate, context, resolve) {
        var bindings = [];

        Binding.executeAsync(tpl, context, model => {
            var elt = tpl.render(model);
            var binding = new Binding(tpl, model);
            bindings.push(binding);
            for (var e = 0; e < tpl.children().length; e++) {
                const child = tpl.children()[e];
                const childBindings = child.bindAsync(model, elt.appendChild.bind(elt));
                binding.children.push.apply(binding.children, childBindings);
            }
            resolve(elt);
        });

        return bindings;
    }

    find(elements, path: HTMLElement[]) {
        debugger;
        var pathIdx = path.length - 1;
        var bindings = [this];

        for (var i = pathIdx; i >= 0; i--) {
            const dom = path[i];
            const domIdx = Array.prototype.indexOf.call(elements, dom);

            if (elements.length !== bindings.map(b => b.countElements()).reduceRight((x, y) => x + y))
                throw new Error("elements.length !== bindings.length");

            if (domIdx >= 0) {
                var binding = bindings[domIdx];

                if (i === 0)
                    return binding;

                bindings = binding.children;
                elements = dom.childNodes;
                // elements = dom.childNodes.splice(skip, take);
            } else {
                console.log('break; ', domIdx, dom, i, bindings.length);
                break;
            }
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

    createExpr(fromExpr) {
        return SelectManyExpression.parse(fromExpr, this.import);
    }

    parseAttr(tagElement: TagElement, attr: Attr) {
        const name = attr.name;
        if (name === "click") {
            const fn = new Function("m", `with(m) { return ${attr.value}; }`);
            tagElement.addEvent("click", fn);
        } else if (name === "data-for" || name === "data-from") {
            tagElement.for(this.createExpr(attr.value));
        } else {
            const tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    }

    traverse(tags, fn) {
        var stack = [];
        for (var e = 0; e < tags.length; e++) {
            stack.push(tags[e]);
        }
        while (stack.length > 0) {
            var cur = stack.pop();

            fn(cur);

            for (let i = 0; !!cur.children && i < cur.children.length; i++) {
                stack.push(cur.children[i]);
            }
        }
    }

    bind(rootDom, model, target) {
        debugger;
        target = target || document.body;
        var tpl = this.parseDom(rootDom);
        var rootElements = [];

        var proxy = Util.proxy(model).create();

        var rootBindings = tpl.bindAsync(proxy, rootElements.push.bind(rootElements));

        for (var i = 0; i < rootElements.length; i++) {
            target.appendChild(rootElements[i]);
        }

        function find(bindings, elements, path) {
            const pathIdx = path.length - 1;
            const result = [];

            for (let i = pathIdx; i >= 0; i--) {
                const dom = path[i];
                const domIdx = Array.prototype.indexOf.call(elements, dom);
                if (domIdx >= 0) {
                    const binding = bindings[domIdx];
                    result.push(binding);
                    bindings = binding.children;
                    elements = dom.childNodes;
                } else {
                    return [];
                }
            }

            return result;
        }

        // var map = this.createTagMap(tags);
        target.addEventListener("click",
            evt => {
                var pathIdx = evt.path.indexOf(target);
                if (pathIdx > 0) {
                    var domPath = evt.path.splice(0, pathIdx);

                    var bindingPath = find(rootBindings, rootElements, domPath);
                    if (bindingPath.length > 0) {
                        var b = bindingPath.pop();
                        var handler = b.tpl.events.get('click');
                        if (!!handler)
                            handler(b.context);
                    }
                }
            });

        target.addEventListener("change",
            evt => {
                var pathIdx = evt.path.indexOf(target);
                if (pathIdx > 0) {
                    const elementPath = evt.path.splice(0, pathIdx);

                    var bindingPath = find(rootBindings, rootElements, elementPath);
                    if (bindingPath.length > 0) {
                        var b = bindingPath.pop();
                        const nameAttr = evt.target.attributes['name'];
                        if (!!nameAttr) {
                            const prop = nameAttr.value;
                            const update = new Function("context", "value",
                                `with (context) { ${prop} = value; }`);

                            update(b.context, evt.target.value);
                        }
                        updateChildren(bindingPath.pop(), evt.target.parentNode);
                    }
                }
            });

        function updateChildren(binding, node) {
            debugger;
            var stack = [{ b: binding, node: node }];
            while (stack.length > 0) {
                var cur = stack.pop();

                cur.b.update(cur.node);

                for (let i = 0; i < cur.b.children.length && i < cur.node.childNodes.length; i++) {
                    const b = cur.b.children[i];
                    const child = cur.node.childNodes[i];

                    stack.push({ b: b, node: child });
                }
            }
        }

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

    //renderAsync(tag, resolve) {
    //    if (typeof tag == "string") {
    //        resolve(document.createTextNode(tag));
    //    } else {
    //        const elt = document.createElement(tag.name);

    //        for (let j = 0; j < tag.children.length; j++) {
    //            this.renderAsync(tag.children[j], elt.appendChild.bind(elt));
    //        }

    //        for (let attrName in tag.attributes) {

    //            if (tag.attributes.hasOwnProperty(attrName)) {
    //                var domAttr = document.createAttribute(attrName);
    //                domAttr.value = tag.attributes[attrName];
    //                elt.setAttributeNode(domAttr);
    //            }
    //        }
    //        resolve(elt);
    //    }
    //};

    createTagMap(tags) {
        var stack = [];
        var map = {};

        for (var e = 0; e < tags.length; e++) {
            stack.push(tags[e]);
        }

        while (stack.length > 0) {
            var cur = stack.pop();

            map[cur.id] = cur;

            for (let i = 0; !!cur.children && i < cur.children.length; i++) {
                stack.push(cur.children[i]);
            }
        }

        return map;
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
