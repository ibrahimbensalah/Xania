var Binding = (function () {
    function Binding(tpl, context) {
        if (context === void 0) { context = null; }
        this.tpl = tpl;
        this.context = context;
        this.children = [];
    }
    Binding.executeAsync = function (tpl, context, resolve) {
        var model = !!tpl.modelAccessor ? tpl.modelAccessor(context) : context, iter = function (data) {
            Util.map(resolve, data);
        };
        if (typeof (model.then) === "function") {
            model.then(iter);
        }
        else {
            iter(model);
        }
    };
    Binding.prototype.countElements = function () {
        return Util.count(this.data);
    };
    Binding.prototype.init = function () {
        var result = [];
        this.initAsync({ appendChild: result.push.bind(result) });
        return result;
    };
    Binding.prototype.update = function (target) {
        this.tpl.update(target, this.context);
    };
    Binding.prototype.initAsync = function (target) {
        var _this = this;
        Binding.executeAsync(this.tpl, this.context, function (model) {
            var elt = _this.tpl.render(model);
            var childBinding = new Binding(_this.tpl, model);
            _this.children.push(childBinding);
            for (var e = 0; e < _this.tpl.children().length; e++) {
                var child = _this.tpl.children()[e];
                var binding = new Binding(child, model);
                _this.children.push(binding);
                binding.initAsync(elt);
            }
            target.appendChild(elt);
        });
    };
    Binding.createAsync = function (tpl, context, resolve) {
        var bindings = [];
        Binding.executeAsync(tpl, context, function (model) {
            var elt = tpl.render(model);
            var binding = new Binding(tpl, model);
            bindings.push(binding);
            for (var e = 0; e < tpl.children().length; e++) {
                var child = tpl.children()[e];
                var childBindings = child.bindAsync(model, elt.appendChild.bind(elt));
                binding.children.push.apply(binding.children, childBindings);
            }
            resolve(elt);
        });
        return bindings;
    };
    Binding.prototype.find = function (elements, path) {
        debugger;
        var pathIdx = path.length - 1;
        var bindings = [this];
        for (var i = pathIdx; i >= 0; i--) {
            var dom = path[i];
            var domIdx = Array.prototype.indexOf.call(elements, dom);
            if (elements.length !== bindings.map(function (b) { return b.countElements(); }).reduceRight(function (x, y) { return x + y; }))
                throw new Error("elements.length !== bindings.length");
            if (domIdx >= 0) {
                var binding = bindings[domIdx];
                if (i === 0)
                    return binding;
                bindings = binding.children;
                elements = dom.childNodes;
            }
            else {
                console.log('break; ', domIdx, dom, i, bindings.length);
                break;
            }
        }
        return this;
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
    Binder.prototype.bind = function (rootDom, model, target) {
        target = target || document.body;
        var tpl = this.parseDom(rootDom);
        var rootElements = [];
        var rootBindings = tpl.bindAsync(model, rootElements.push.bind(rootElements));
        for (var i = 0; i < rootElements.length; i++) {
            target.appendChild(rootElements[i]);
        }
        function find(bindings, elements, path) {
            var pathIdx = path.length - 1;
            var result = [];
            for (var i_1 = pathIdx; i_1 >= 0; i_1--) {
                var dom = path[i_1];
                var domIdx = Array.prototype.indexOf.call(elements, dom);
                if (domIdx >= 0) {
                    var binding = bindings[domIdx];
                    result.push(binding);
                    bindings = binding.children;
                    elements = dom.childNodes;
                }
                else {
                    return [];
                }
            }
            return result;
        }
        // var map = this.createTagMap(tags);
        target.addEventListener("click", function (evt) {
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
        target.addEventListener("change", function (evt) {
            var pathIdx = evt.path.indexOf(target);
            if (pathIdx > 0) {
                var elementPath = evt.path.splice(0, pathIdx);
                var bindingPath = find(rootBindings, rootElements, elementPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    var nameAttr = evt.target.attributes['name'];
                    if (!!nameAttr) {
                        var prop = nameAttr.value;
                        var update = new Function("context", "value", "with (context) { " + prop + " = value; }");
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
                for (var i_2 = 0; i_2 < cur.b.children.length && i_2 < cur.node.childNodes.length; i_2++) {
                    var b = cur.b.children[i_2];
                    var child = cur.node.childNodes[i_2];
                    stack.push({ b: b, node: child });
                }
            }
        }
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