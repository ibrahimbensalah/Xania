var Binder = (function () {
    function Binder(compile) {
        if (compile === void 0) { compile = TemplateEngine.compile; }
        this.compile = compile;
    }
    Binder.prototype.import = function (itemType) {
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
    };
    Binder.prototype.createExpr = function (fromExpr) {
        return SelectManyExpression.parse(fromExpr, this.import);
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
    Binder.prototype.bind = function (rootElements) {
        var result = [];
        var stack = [];
        var i;
        for (i = rootElements.length - 1; i >= 0; i--) {
            stack.push({ node: rootElements[i], push: Array.prototype.push.bind(result) });
        }
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
        return result;
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
    Binder.prototype.toDOMAsync = function (tags, resolve) {
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (typeof tag == "string") {
                resolve(document.createTextNode(tag));
            }
            else {
                var elt = document.createElement(tag.name);
                var tagid = document.createAttribute("__tagid");
                tagid.value = tag.id;
                elt.setAttributeNode(tagid);
                for (var j = 0; j < tag.children.length; j++) {
                    Array.isArray(tag.children[j])
                        ? this.toDOMAsync(tag.children[j], elt.appendChild.bind(elt))
                        : this.toDOMAsync([tag.children[j]], elt.appendChild.bind(elt));
                }
                for (var attrName in tag.attributes) {
                    if (tag.attributes.hasOwnProperty(attrName)) {
                        var domAttr = document.createAttribute(attrName);
                        domAttr.value = tag.attributes[attrName];
                        elt.setAttributeNode(domAttr);
                    }
                }
                resolve(elt);
            }
        }
    };
    ;
    Binder.prototype.createTagMap = function (tags) {
        var stack = [];
        var map = {};
        for (var e = 0; e < tags.length; e++) {
            stack.push(tags[e]);
        }
        while (stack.length > 0) {
            var cur = stack.pop();
            map[cur.id] = cur;
            for (var i = 0; !!cur.children && i < cur.children.length; i++) {
                stack.push(cur.children[i]);
            }
        }
        return map;
    };
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