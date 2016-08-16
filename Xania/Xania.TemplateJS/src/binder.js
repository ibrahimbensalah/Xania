var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
    Binding.prototype.render = function (context) { throw new Error("Not implemented"); };
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
                if (!deps[property].has(subsriber)) {
                    deps[property].add(subsriber);
                    return true;
                }
            }
            else {
                deps[property] = new Set().add(subsriber);
                return true;
            }
        }
        else {
            var deps = {};
            this.subscriptions.set(object, deps);
            deps[property] = new Set().add(subsriber);
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
        return null;
    };
    Observer.prototype.unsubscribe = function (subscription) {
        var _this = this;
        while (subscription.dependencies.length > 0) {
            var dep = subscription.dependencies.pop();
            if (!this.subscriptions.has(dep.obj))
                debugger;
            var deps = this.subscriptions.get(dep.obj);
            if (!deps.hasOwnProperty(dep.property))
                debugger;
            if (!deps[dep.property].has(subscription))
                debugger;
            deps[dep.property].delete(subscription);
        }
        subscription.children.forEach(function (child) {
            _this.unsubscribe(child);
        });
    };
    Observer.prototype.subscribe = function (context, update) {
        var additionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            additionalArgs[_i - 2] = arguments[_i];
        }
        var self = this, observable, updateArgs;
        var subscription = {
            parent: undefined,
            children: new Set(),
            state: undefined,
            dependencies: [],
            notify: function () {
                var _this = this;
                self.unsubscribe(this);
                Xania.ready(this.state)
                    .then(function (s) { return _this.state = update.apply(self, updateArgs.concat([s])); });
            },
            then: function (resolve) {
                return Xania.ready(this.state).then(resolve);
            },
            subscribe: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                return self.subscribe.apply(self, args);
            },
            attach: function (parent) {
                if (this.parent === parent)
                    return;
                if (!!this.parent)
                    this.parent.children.delete(this);
                this.parent = parent;
                if (!!parent)
                    parent.children.add(this);
            }
        };
        observable = Xania.observe(context, {
            setRead: function (obj, property) {
                var init = self.size;
                console.debug("read", { obj: obj, property: property });
                if (self.add(obj, property, subscription)) {
                    var end = self.size;
                    if (end !== init + 1)
                        debugger;
                    subscription.dependencies.push({ obj: obj, property: property });
                }
            },
            setChange: function (obj, property) {
                throw new Error("invalid change");
            }
        });
        updateArgs = [observable, subscription].concat(additionalArgs);
        subscription.notify();
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
                if (!!subscribers) {
                    subscribers.forEach(function (s) {
                        observer.dirty.add(s);
                    });
                }
            }
        });
    };
    Observer.prototype.update = function () {
        var _this = this;
        window.requestAnimationFrame(function () {
            _this.dirty.forEach(function (subscriber) {
                subscriber.notify();
            });
            _this.dirty.clear();
        });
        console.debug("total subscriptions", this.size);
    };
    Object.defineProperty(Observer.prototype, "size", {
        get: function () {
            var total = 0;
            this.subscriptions.forEach(function (deps) {
                for (var p in deps) {
                    if (deps.hasOwnProperty(p)) {
                        total += deps[p].size;
                    }
                }
            });
            return total;
        },
        enumerable: true,
        configurable: true
    });
    return Observer;
})();
var ContentBinding = (function (_super) {
    __extends(ContentBinding, _super);
    function ContentBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
        this.dom = document.createTextNode("");
    }
    ContentBinding.prototype.update = function (context) {
        this.dom.textContent = this.tpl.execute(context);
    };
    ContentBinding.prototype.init = function (observer) {
        var _this = this;
        var update = function (context) {
            _this.update(context);
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
    ContentBinding.prototype.render = function (context) {
        this.dom.textContent = this.tpl.execute(context);
    };
    return ContentBinding;
})(Binding);
var TagBinding = (function (_super) {
    __extends(TagBinding, _super);
    function TagBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
        this.children = [];
        this.dom = document.createElement(tpl.name);
        this.dom.attributes["__binding"] = this;
    }
    TagBinding.prototype.render = function (context) {
        var tpl = this.tpl;
        var dom = this.dom;
        var attributes = tpl.executeAttributes(context);
        for (var attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var newValue = Xania.join(" ", attributes[attrName]);
                var oldValue = dom[attrName];
                if (oldValue === newValue)
                    continue;
                dom[attrName] = newValue;
                if (typeof newValue === "undefined" || newValue === null) {
                    dom.removeAttribute(attrName);
                }
                else if (attrName === "value") {
                    dom["value"] = newValue;
                }
                else {
                    var domAttr = dom.attributes[attrName];
                    if (!!domAttr) {
                        domAttr.nodeValue = newValue;
                        domAttr.value = newValue;
                    }
                    else {
                        domAttr = document.createAttribute(attrName);
                        domAttr.value = newValue;
                        dom.setAttributeNode(domAttr);
                    }
                }
            }
        }
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
        this.observer = new Observer();
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
            var fn = this.compile(attr.value);
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
    Binder.execute = function (rootContext, rootTpl, rootTarget, observer) {
        var visit = function (parent, context, tpl, target, offset) {
            var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;
            return observer.subscribe(context, function (observable, subscription, state) {
                if (state === void 0) { state = { length: 0 }; }
                subscription.attach(parent);
                return Xania.ready(modelAccessor(observable))
                    .then(function (model) {
                    model = Xania.unwrap(model);
                    return Array.isArray(model) ? model : [model];
                })
                    .then(function (arr) {
                    var prevLength = state.length;
                    for (var e = prevLength - 1; e >= 0; e--) {
                        var idx = offset + e;
                        target.removeChild(target.childNodes[idx]);
                    }
                    for (var idx = 0; idx < arr.length; idx++) {
                        var result = Xania.assign({}, context, arr[idx]);
                        var binding = tpl.bind(result);
                        observer.subscribe(result, binding.render.bind(binding)).attach(subscription);
                        var visitChild = Xania.partialApp(function (data, parent, prev, cur) {
                            return Xania.ready(prev)
                                .then(function (p) {
                                return visit(subscription, data, cur, parent, p).then(function (x) { return p + x.length; });
                            });
                        }, result, binding.dom);
                        tpl.children().reduce(visitChild, 0);
                        if (offset + idx < target.childNodes.length)
                            target.insertBefore(binding.dom, target.childNodes[offset + idx]);
                        else
                            target.appendChild(binding.dom);
                    }
                    return { length: arr.length };
                });
            });
        };
        visit(null, rootContext, rootTpl, rootTarget, 0);
    };
    Binder.prototype.bind = function (content, model, target) {
        for (var i = content.childNodes.length - 1; i >= 0; i--) {
            var tpl = this.parseDom(content.childNodes[i]);
            this.bindTemplate(tpl, model, target || document.body);
        }
    };
    Binder.prototype.bindTemplate = function (tpl, model, target) {
        var _this = this;
        var arr = Array.isArray(model) ? model : [model];
        for (var i = 0; i < arr.length; i++) {
            Binder.execute(arr[i], tpl, target, this.observer);
        }
        var eventHandler = function (target, name, path) {
            var binding = target.attributes["__binding"];
            if (!!binding) {
                var handler = binding.tpl.events.get(name);
                if (!!handler) {
                    var observable = _this.observer.track(binding.context);
                    handler(observable);
                    _this.observer.update();
                }
            }
        };
        target.addEventListener("click", function (evt) { return eventHandler(evt.target, evt.type, evt.path); });
        var onchange = function (evt) {
            var binding = evt.target.attributes["__binding"];
            if (binding != null) {
                var nameAttr = evt.target.attributes["name"];
                if (!!nameAttr) {
                    var proxy = _this.observer.track(binding.context);
                    var prop = nameAttr.value;
                    var update = new Function("context", "value", "with (context) { " + prop + " = value; }");
                    update(proxy, evt.target.value);
                }
            }
        };
        target.addEventListener("keyup", function (evt) {
            if (evt.keyCode === 13) {
                eventHandler(evt.target, "keyup.enter", evt.path);
            }
            else {
                onchange(evt);
            }
            _this.observer.update();
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
        var returnExpr = template.replace(/@([\w\(\)\.']+)/gim, function (a, b) {
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