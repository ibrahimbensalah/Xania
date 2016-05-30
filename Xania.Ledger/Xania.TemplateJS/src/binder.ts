class Binder {

    constructor(private loader: any, public compile: Function = TemplateEngine.compile) {

    }

    createExpr(fromExpr) {
        var self = this;
        var expr = SelectManyExpression.parse(fromExpr);
        return model => ({
            then(resolve) {
                var context = { model: model, loader: self.loader };
                return expr.executeAsync(context, resolve);
            }
        });
    }

    bindAttr(tagElement: TagElement, attr: Attr) {
        const name = attr.name;
        if (name === "data-for" || name === "data-from") {
            tagElement.for(this.createExpr(attr.value));
        } else {
            const tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    };

    bind(rootDom: HTMLElement, rootModel: any) {
        const result = [];
        const stack = [{ node: <Node>rootDom, push: Array.prototype.push.bind(result) }];
        while (stack.length > 0) {
            const cur = stack.pop();
            const node: Node = cur.node;
            const push = cur.push;

            if (node.nodeType === 1) {
                var elt = <HTMLElement>node;
                var template = new TagElement(elt.tagName);
                push(template);

                for (var i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                    var attribute = elt.attributes[i];
                    this.bindAttr(template, attribute);
                }

                for (let i = elt.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                }
            } else if (node.nodeType === 3) {
                const tpl = this.compile(node.textContent);
                push(new TextContent(tpl || node.textContent));
            }
        }

        rootDom.innerHTML = this.toHtml(result[0].render(rootModel));
    }

    toHtml(tags): string {
        var html = "";
        debugger;
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (typeof tag == "string")
                html += tag;
            else {
                html += `<${tag.name}`;
                for (var e = 0; e < tag.attributes.length; e++) {
                    var attr = tag.attributes[e];
                    html += ` ${attr.name}="${attr.value}"`;
                }
                html += `>`;
                for (var j = 0; j < tag.children.length; j++) {
                    if (Array.isArray(tag.children[j]))
                        html += this.toHtml(tag.children[j]);
                    else 
                        html += this.toHtml([ tag.children[j] ]);
                }
                html += `</${tag.name}>`;
            }
        }
        return html;
    };
}

class TemplateEngine {
    private static cacheFn: any = {};

    static compile(input) {
        if (!input || !input.trim()) {
            return null;
        }

        var template = input.replace(/\n/g, "\\n");
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
