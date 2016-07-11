var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Binding = (function () {
    function Binding(context, idx) {
        this.context = context;
        this.idx = idx;
        this.deps = new Map();
    }
    Binding.executeAsync = function (tpl, context, resolve) {
        var model = !!tpl.modelAccessor ? tpl.modelAccessor(context) : context, iter = function (data) {
            Xania.map(resolve, data);
        };
        if (typeof (model.then) === "function") {
            model.then(iter);
        }
        else {
            iter(model);
        }
    };
    Binding.prototype.update = function () {
        throw new Error("Abstract method Binding.update");
    };
    Binding.prototype.init = function () {
        throw new Error("Abstract method Binding.update");
    };
    Binding.create = function (tpl, context) {
        var results = [];
        Binding.createAsync(tpl, context).then(results.push.bind(results));
        return results;
    };
    Binding.createAsync = function (tpl, context) {
        return {
            then: function (resolve) {
                Binding.executeAsync(tpl, context, function (model, idx) {
                    if (typeof idx == "undefined")
                        throw new Error("model idx is not defined");
                    resolve(tpl.bind(model, idx).init());
                });
            }
        };
    };
    Binding.prototype.dependsOn = function (context, prop) {
        if (this.deps.has(context)) {
            console.log(prop);
            if (prop === null)
                return true;
            return this.deps.get(context).indexOf(prop) >= 0;
        }
        return false;
    };
    return Binding;
})();
var ContentBinding = (function (_super) {
    __extends(ContentBinding, _super);
    function ContentBinding(tpl, context, idx) {
        _super.call(this, context, idx);
        this.tpl = tpl;
    }
    ContentBinding.prototype.update = function () {
        this.dom.textContent = this.tpl.execute(this.context);
    };
    ContentBinding.prototype.init = function () {
        var observable = Xania.observe(this.context, this.deps);
        var text = this.tpl.execute(observable);
        this.dom = document.createTextNode(text);
        return this;
    };
    return ContentBinding;
})(Binding);
var TagBinding = (function (_super) {
    __extends(TagBinding, _super);
    function TagBinding(tpl, context, idx) {
        _super.call(this, context, idx);
        this.tpl = tpl;
        this.children = [];
    }
    TagBinding.prototype.renderTag = function () {
        var elt = document.createElement(this.tpl.name);
        var attributes = this.tpl.executeAttributes(this.context);
        for (var attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var domAttr = document.createAttribute(attrName);
                domAttr.value = attributes[attrName];
                elt.setAttributeNode(domAttr);
            }
        }
        return elt;
    };
    TagBinding.prototype.update = function () {
    };
    TagBinding.prototype.init = function () {
        var _this = this;
        this.dom = this.renderTag();
        var children = this.tpl.children();
        for (var e = 0; e < children.length; e++) {
            Binding.createAsync(children[e], this.context)
                .then(function (child) {
                child.parent = _this;
                _this.dom.appendChild(child.dom);
                _this.children.push(child);
            });
        }
        return this;
    };
    return TagBinding;
})(Binding);
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
    Binder.prototype.parseAttr = function (tagElement, attr) {
        var name = attr.name;
        if (name === "click") {
            var fn = new Function("m", "with(m) { return " + attr.value + "; }");
            tagElement.addEvent("click", fn);
        }
        else if (name === "data-for" || name === "data-from") {
            tagElement.for(attr.value, this.import);
        }
        else {
            var tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    };
    Binder.prototype.bind = function (rootDom, model, target) {
        var _this = this;
        target = target || document.body;
        var tpl = this.parseDom(rootDom);
        var rootBindings = [];
        Binding.createAsync(tpl, model)
            .then(function (rootBinding) {
            rootBindings.push(rootBinding);
            target.appendChild(rootBinding.dom);
        });
        function find(bindings, path) {
            var result = [];
            for (var i = path.length - 1; i >= 0; i--) {
                var dom = path[i];
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
        target.addEventListener("click", function (evt) {
            var pathIdx = evt.path.indexOf(target);
            if (pathIdx > 0) {
                var domPath = evt.path.splice(0, pathIdx);
                var bindingPath = find(rootBindings, domPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    var handler = b.tpl.events.get('click');
                    if (!!handler) {
                        handler(b.context);
                        _this.updateAll(rootBindings, b.context, null);
                    }
                }
            }
        });
        var onchange = function (evt) {
            var pathIdx = evt.path.indexOf(target);
            if (pathIdx > 0) {
                var elementPath = evt.path.splice(0, pathIdx);
                var bindingPath = find(rootBindings, elementPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    var nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        var prop = nameAttr.value;
                        var update = new Function("context", "value", "with (context) { " + prop + " = value; }");
                        update(b.context, evt.target.value);
                        _this.updateAll(rootBindings, b.context, prop);
                    }
                }
            }
        };
        target.addEventListener("keyup", onchange);
    };
    Binder.prototype.updateAll = function (rootBindings, context, prop) {
        var stack = [];
        stack.push.apply(stack, rootBindings);
        while (stack.length > 0) {
            var current = stack.pop();
            if (current.dependsOn(context, prop))
                current.update();
            if (current instanceof TagBinding) {
                var tag = current;
                stack.push.apply(stack, tag.children);
            }
        }
    };
    Binder.prototype.updateFamily = function (b, prop) {
        do {
            for (var i = 0; i < b.children.length; i++) {
                var child = b.children[i];
            }
            b = b.parent;
        } while (b.parent);
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