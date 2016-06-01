var Binder = (function () {
    function Binder(loader, compile) {
        if (compile === void 0) { compile = TemplateEngine.compile; }
        this.loader = loader;
        this.compile = compile;
    }
    Binder.prototype.createExpr = function (fromExpr) {
        var self = this;
        var expr = SelectManyExpression.parse(fromExpr);
        return function (model) { return ({
            then: function (resolve) {
                var context = { model: model, loader: self.loader };
                return expr.executeAsync(context, resolve);
            }
        }); };
    };
    Binder.prototype.bindAttr = function (tagElement, attr) {
        var name = attr.name;
        if (name === "click") {
            var fn = new Function("m", "with(m) { return " + attr.value + "; }");
            tagElement.addEvent("click", fn);
        }
        else if (name === "data-for" || name === "data-from") {
            tagElement.for(this.createExpr(attr.value));
        }
        else {
            var tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    };
    Binder.prototype.bind = function (rootDom, rootModel) {
        var result = [];
        var stack = [{ node: rootDom, push: Array.prototype.push.bind(result) }];
        var i;
        while (stack.length > 0) {
            var cur = stack.pop();
            var node = cur.node;
            var push = cur.push;
            if (node.nodeType === 1) {
                var elt = node;
                var template = new TagElement(elt.tagName);
                push(template);
                for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                    var attribute = elt.attributes[i];
                    this.bindAttr(template, attribute);
                }
                for (i = elt.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                }
            }
            else if (node.nodeType === 3) {
                var tpl = this.compile(node.textContent);
                push(new TextContent(tpl || node.textContent));
            }
        }
        // rootDom.innerHTML = this.toHtml(result[0].render(rootModel));
        var dom = this.toDOM(result[0].render(rootModel));
        for (i = 0; i < dom.length; i++) {
            document.body.appendChild(dom[i]);
        }
        // console.log(dom);
    };
    Binder.prototype.toHtml = function (tags) {
        var html = "";
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (typeof tag == "string")
                html += tag;
            else {
                html += "<" + tag.name;
                for (var e = 0; e < tag.attributes.length; e++) {
                    var attr = tag.attributes[e];
                    html += " " + attr.name + "=\"" + attr.value + "\"";
                }
                html += ">";
                for (var j = 0; j < tag.children.length; j++) {
                    if (Array.isArray(tag.children[j]))
                        html += this.toHtml(tag.children[j]);
                    else
                        html += this.toHtml([tag.children[j]]);
                }
                html += "</" + tag.name + ">";
            }
        }
        return html;
    };
    ;
    Binder.prototype.toDOM = function (tags) {
        var html = [];
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (typeof tag == "string")
                html.push(document.createTextNode(tag));
            else {
                var elt = document.createElement(tag.name);
                html.push(elt);
                for (var attrName in tag.attributes) {
                    var domAttr = document.createAttribute(attrName);
                    domAttr.value = tag.attributes[attrName];
                    elt.setAttributeNode(domAttr);
                }
                for (var n = 0; n < tag.events.length; n++) {
                    var event = tag.events[n];
                    // console.log(event.name);
                    elt.addEventListener(event.name, event.handler);
                }
                for (var j = 0; j < tag.children.length; j++) {
                    var children = Array.isArray(tag.children[j])
                        ? this.toDOM(tag.children[j])
                        : this.toDOM([tag.children[j]]);
                    for (var m in children) {
                        elt.appendChild(children[m]);
                    }
                }
            }
        }
        return html;
    };
    ;
    return Binder;
})();
var TemplateEngine = (function () {
    function TemplateEngine() {
    }
    TemplateEngine.compile = function (input) {
        if (!input || !input.trim()) {
            return null;
        }
        var template = input.replace(/\n/g, "\\\n");
        var params = "";
        // var returnExpr = template.replace(/@([a-z_][\.a-z0-9_]*)/gim, (a, b) => {
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, function (a, b) {
            var paramIdx = "arg" + params.length;
            params += "var " + paramIdx + " = " + b + ";";
            return "\" + " + paramIdx + " + \"";
        });
        if (params.length > 0) {
            if (!TemplateEngine.cacheFn[input]) {
                var functionBody = "with(m) {" + params + "return \"" + returnExpr + "\"}";
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return function () { return returnExpr; };
    };
    TemplateEngine.cacheFn = {};
    return TemplateEngine;
})();
//# sourceMappingURL=binder.js.map