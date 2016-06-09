var Binding = (function () {
    function Binding(model) {
        this.model = model;
        this.elements = [];
    }
    Binding.prototype.attach = function (elt) {
        this.elements.push(elt);
    };
    return Binding;
})();
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
    Binder.prototype.parseAttr = function (tagElement, attr) {
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
    Binder.prototype.traverse = function (tags, fn) {
        var stack = [];
        for (var e = 0; e < tags.length; e++) {
            stack.push(tags[e]);
        }
        while (stack.length > 0) {
            var cur = stack.pop();
            fn(cur);
            for (var i = 0; !!cur.children && i < cur.children.length; i++) {
                stack.push(cur.children[i]);
            }
        }
    };
    Binder.prototype.renderTemplateAsync = function (tpl, model, resolve) {
        var self = this, bindings = [];
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
    };
    Binder.prototype.bind = function (rootDom, model, target) {
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
        target.addEventListener("click", function (evt) {
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
    };
    Binder.prototype.parseDom = function (rootDom) {
        var stack = [];
        var i;
        var rootTpl;
        stack.push({
            node: rootDom,
            push: function (e) {
                rootTpl = e;
            }
        });
        while (stack.length > 0) {
            var cur = stack.pop();
            var node = cur.node;
            var push = cur.push;
            if (node.nodeType === 1) {
                var elt = node;
                var template = new TagElement(elt.tagName);
                for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                    var attribute = elt.attributes[i];
                    this.parseAttr(template, attribute);
                }
                for (i = elt.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                }
                push(template);
            }
            else if (node.nodeType === 3) {
                var tpl = this.compile(node.textContent);
                push(new TextContent(tpl || node.textContent));
            }
        }
        return rootTpl;
    };
    Binder.prototype.renderAsync = function (tag, resolve) {
        if (typeof tag == "string") {
            resolve(document.createTextNode(tag));
        }
        else {
            var elt = document.createElement(tag.name);
            for (var j = 0; j < tag.children.length; j++) {
                this.renderAsync(tag.children[j], elt.appendChild.bind(elt));
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