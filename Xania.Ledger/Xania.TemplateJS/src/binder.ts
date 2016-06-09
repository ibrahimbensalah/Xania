class Binding {

    private elements: HTMLElement[] = [];

    constructor(public model: any) {
    }

    attach(elt: HTMLElement) {
        this.elements.push(elt);
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

    renderTemplateAsync(tpl: TagElement, model, resolve) {
        var self = this,
            bindings:Binding[] = [];
        tpl.executeAsync(model, function (tpl, m) {
            var elt = tpl.render(m);
            for (var e = 0; !!tpl.children && e < tpl.children.length; e++) {
                var child = tpl.children[e];
                self.renderTemplateAsync(child, m, elt.appendChild.bind(elt));
            }

            var binding = new Binding(m);
            binding.attach(elt);
            bindings.push(binding);

            resolve(elt);
        }.bind(this, tpl));
        return bindings;
    }

    bind(rootDom, model, target) {
        target = target || document.body;
        // var bindings: Binding[] = [];
        var tpl = this.parseDom(rootDom);

        var bindings = this.renderTemplateAsync(tpl, model, target.appendChild.bind(target));
        console.log(bindings);

        //tpl
        //    .executeAsync(model,
        //        tag => {
        //            var binding = new Binding(model);
        //            this.renderAsync(tag, dom => {
        //                binding.attach(dom);
        //                target.appendChild(dom);
        //            });
        //            bindings.push(binding);
        //    });
        //console.log(bindings);

        // var map = this.createTagMap(tags);
        target.addEventListener("click",
            evt => {
                console.log(evt.eventName);
                //        var tagid = evt.target.getAttribute("__tagid");
                //        if (!!tagid && !!map[tagid] && !!map[tagid].events.click) {
                //            var tagDefinition = map[tagid];
                //            var handler = tagDefinition.events.click;
                //            if (!!handler) {
                //                handler();
                //            }
                //        }
            });
        //rootDom.addEventListener("change",
        //    evt => {
        //        var tagid = evt.target.getAttribute("__tagid");
        //        if (!!tagid && !!map[tagid] && !!map[tagid].events.update) {
        //            var handler = map[tagid].events.update;
        //            if (!!handler) {
        //                handler(evt.target.value);
        //            }
        //        }
        //    });

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

    renderAsync(tag, resolve) {
        if (typeof tag == "string") {
            resolve(document.createTextNode(tag));
        } else {
            const elt = document.createElement(tag.name);

            for (let j = 0; j < tag.children.length; j++) {
                this.renderAsync(tag.children[j], elt.appendChild.bind(elt));
            }

            for (let attrName in tag.attributes) {

                if (tag.attributes.hasOwnProperty(attrName)) {
                    var domAttr = document.createAttribute(attrName);
                    domAttr.value = tag.attributes[attrName];
                    elt.setAttributeNode(domAttr);
                }
            }
            resolve(elt);
        }
    };

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
