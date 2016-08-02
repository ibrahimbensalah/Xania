var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BindingContext = (function () {
    function BindingContext(tpl, context, addChild) {
        this.tpl = tpl;
        this.context = context;
        this.addChild = addChild;
        this.bindings = [];
    }
    BindingContext.update = function (target, modelAccessor, resolve) {
        var model = modelAccessor(target);
        if (typeof (model.then) === "function") {
            model.then.call(this, resolve);
        }
        else {
            resolve.call(this, model);
        }
    };
    BindingContext.prototype.execute = function (observer, offset) {
        var _this = this;
        var context = this.context;
        var tpl = this.tpl;
        var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;
        observer.subscribe(context, function (ctx) {
            Xania.ready(modelAccessor(ctx), function (model) {
                model = Xania.unwrap(model);
                var arr = Array.isArray(model) ? model : [model];
                var children = [];
                for (var i = 0; i < arr.length; i++) {
                    var result = Xania.assign({}, context, arr[i]);
                    var child = tpl.bind(result).init(observer);
                    children.push(child);
                    _this.addChild(child, i);
                }
                return children;
            });
        });
    };
    return BindingContext;
})();
var Binding = (function () {
    function Binding(context) {
        this.context = context;
        this.destroyed = false;
    }
    Binding.prototype.init = function (observer) {
        throw new Error("Abstract method Binding.update");
    };
    Binding.prototype.addChild = function (child, idx) {
        throw new Error("Abstract method Binding.update");
    };
    Binding.prototype.destroy = function () { throw new Error("Not implemented"); };
    return Binding;
})();
var Observer = (function () {
    function Observer() {
        this.subscriptions = new Map();
        this.dirty = new Set();
    }
    Observer.prototype.add = function (object, property, subsriber) {
        if (this.subscriptions.has(object)) {
            var deps = this.subscriptions.get(object);
            if (deps.hasOwnProperty(property)) {
                if (deps[property].indexOf(subsriber) < 0) {
                    deps[property].push(subsriber);
                    return true;
                }
            }
            else {
                deps[property] = [subsriber];
                return true;
            }
        }
        else {
            console.debug("observe object", object);
            var deps = {};
            deps[property] = [subsriber];
            this.subscriptions.set(object, deps);
            return true;
        }
        return false;
    };
    Observer.prototype.get = function (object, property) {
        if (!this.subscriptions.has(object))
            return [];
        var deps = this.subscriptions.get(object);
        if (deps.hasOwnProperty(property))
            return deps[property];
        return [];
    };
    Observer.prototype.remove = function (object, property, subscr) {
        if (!this.subscriptions.has(object))
            return false;
        var deps = this.subscriptions.get(object);
        if (deps.hasOwnProperty(property)) {
            deps[property] = deps[property].filter(function (s) { return s !== subscr; });
        }
    };
    Observer.prototype.subscribe = function (context, update) {
        var additionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            additionalArgs[_i - 2] = arguments[_i];
        }
        var self = this, observable, updateArgs;
        var subscription = {
            state: null,
            dependencies: [],
            notify: function () {
                for (var i = 0; i < this.dependencies.length; i++) {
                    var dep = this.dependencies[i];
                    self.remove(dep.obj, dep.property, this);
                }
                this.dependencies = [];
                this.state = update.apply(subscription, updateArgs);
            }
        };
        observable = Xania.observe(context, {
            setRead: function (obj, property) {
                if (self.add(obj, property, subscription))
                    subscription.dependencies.push({ obj: obj, property: property });
            },
            setChange: function (obj, property) {
                throw new Error("invalid change");
            }
        });
        updateArgs = [observable].concat(additionalArgs);
        subscription.state = update.apply(subscription, [observable].concat(additionalArgs));
        return subscription;
    };
    Observer.prototype.track = function (context) {
        var observer = this;
        return Xania.observe(context, {
            setRead: function () {
            },
            setChange: function (obj, property) {
                console.debug("write", obj, property, obj[property]);
                var subscribers = observer.get(obj, property);
                for (var i = 0; i < subscribers.length; i++) {
                    observer.dirty.add(subscribers[i]);
                }
            }
        });
    };
    Observer.prototype.update = function () {
        this.dirty.forEach(function (subscriber) {
            subscriber.notify();
        });
        this.dirty.clear();
    };
    return Observer;
})();
var ContentBinding = (function (_super) {
    __extends(ContentBinding, _super);
    function ContentBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
    }
    ContentBinding.prototype.init = function (observer) {
        var _this = this;
        var update = function (context) {
            var text = _this.tpl.execute(context);
            if (!!_this.dom) {
                _this.dom.textContent = text;
            }
            else {
                _this.dom = document.createTextNode(text);
            }
        };
        observer.subscribe(this.context, update);
        return this;
    };
    ContentBinding.prototype.destroy = function () {
        if (!!this.dom) {
            this.dom.remove();
        }
        this.destroyed = true;
    };
    return ContentBinding;
})(Binding);
var TagBinding = (function (_super) {
    __extends(TagBinding, _super);
    function TagBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
        this.children = [];
    }
    TagBinding.prototype.updateTag = function (context) {
        var tagBinding = this;
        if (typeof tagBinding.dom === "undefined") {
            tagBinding.dom = document.createElement(tagBinding.tpl.name);
        }
        var elt = tagBinding.dom;
        var attributes = tagBinding.tpl.executeAttributes(context);
        for (var attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var attrValue = Xania.join(" ", attributes[attrName]);
                elt[attrName] = attrValue;
                if (typeof attrValue === "undefined" || attrValue === null) {
                    elt.removeAttribute(attrName);
                }
                else if (attrName === "value") {
                    elt["value"] = attrValue;
                }
                else {
                    var domAttr = elt.attributes[attrName];
                    if (!!domAttr) {
                        domAttr.nodeValue = attrValue;
                        domAttr.value = attrValue;
                    }
                    else {
                        domAttr = document.createAttribute(attrName);
                        domAttr.value = attrValue;
                        elt.setAttributeNode(domAttr);
                    }
                }
            }
        }
    };
    TagBinding.prototype.init = function (observer) {
        var _this = this;
        if (observer === void 0) { observer = new Observer(); }
        var update = function (context, tagBinding) {
            if (tagBinding.destroyed)
                return;
            if (!!tagBinding.dom)
                console.debug("update tag", tagBinding.dom);
            tagBinding.updateTag(context);
            for (var i = 0; i < tagBinding.children.length; i++) {
                tagBinding.children[i].destroy();
            }
            tagBinding.tpl.children().map(function (tpl) {
                var bc = new BindingContext(tpl, _this.context, function (child) {
                    tagBinding.children.push(child);
                    tagBinding.dom.appendChild(child.dom);
                });
                bc.execute(observer, 0);
            });
            console.debug("update complete");
        };
        observer.subscribe(this.context, update, this);
        return this;
    };
    TagBinding.prototype.addChild = function (child) {
        child.parent = this;
        this.children.push(child);
        this.dom.appendChild(child.dom);
    };
    TagBinding.prototype.destroy = function () {
        if (!!this.dom) {
            this.dom.remove();
        }
        this.destroyed = true;
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
        if (name === "click" || name.startsWith("keyup.")) {
            var fn = new Function("m", "with(m) { return " + attr.value + "; }");
            tagElement.addEvent(name, fn);
        }
        else if (name === "data-for" || name === "data-from") {
            tagElement.for(attr.value, this.import);
        }
        else if (name === "checked") {
            var fn = this.compile(attr.value);
            tagElement.attr(name, Xania.compose(function (ctx) { return !!ctx ? "checked" : null; }, fn));
        }
        else {
            var tpl = this.compile(attr.value);
            tagElement.attr(name, tpl || attr.value);
        }
    };
    Binder.prototype.bind = function (rootDom, model, target) {
        target = target || document.body;
        var tpl = this.parseDom(rootDom);
        var rootBindings = [];
        var observer = new Observer();
        var arr = Array.isArray(model) ? model : [model];
        for (var i = 0; i < arr.length; i++) {
            var bindingContext = new BindingContext(tpl, arr[i], function (rootBinding) {
                rootBindings.push(rootBinding);
                target.appendChild(rootBinding.dom);
            });
            bindingContext.execute(observer, 0);
        }
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
        var eventHandler = function (name, path) {
            var pathIdx = path.indexOf(target);
            if (pathIdx > 0) {
                var domPath = path.splice(0, pathIdx);
                var bindingPath = find(rootBindings, domPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    var handler = b.tpl.events.get(name);
                    if (!!handler) {
                        var observable = observer.track(b.context);
                        handler(observable);
                        observer.update();
                    }
                }
            }
        };
        target.addEventListener("click", function (evt) { return eventHandler(evt.type, evt.path); });
        var onchange = function (evt) {
            var pathIdx = evt.path.indexOf(target);
            if (pathIdx > 0) {
                var elementPath = evt.path.splice(0, pathIdx);
                var bindingPath = find(rootBindings, elementPath);
                if (bindingPath.length > 0) {
                    var b = bindingPath.pop();
                    var nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        var proxy = observer.track(b.context);
                        var prop = nameAttr.value;
                        var update = new Function("context", "value", "with (context) { " + prop + " = value; }");
                        update(proxy, evt.target.value);
                    }
                }
            }
        };
        target.addEventListener("keyup", function (evt) {
            if (evt.keyCode === 13) {
                eventHandler("keyup.enter", evt.path);
            }
            else {
                onchange(evt);
            }
            observer.update();
        });
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
                var template = new TagTemplate(elt.tagName);
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
                push(new TextTemplate(tpl || node.textContent));
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
        var decl = [];
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, function (a, b) {
            var paramIdx = "arg" + decl.length;
            decl.push(b);
            return "\"+" + paramIdx + "+\"";
        });
        if (returnExpr === '"+arg0+"') {
            if (!TemplateEngine.cacheFn[input]) {
                var functionBody = "with(m) {return " + decl[0] + ";}";
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        else if (decl.length > 0) {
            var params = decl.map(function (v, i) { return ("var arg" + i + " = " + v); }).join(";");
            if (!TemplateEngine.cacheFn[input]) {
                var functionBody = "with(m) {" + params + ";return \"" + returnExpr + "\"}";
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