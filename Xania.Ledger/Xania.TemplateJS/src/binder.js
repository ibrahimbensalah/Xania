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
            model.then(resolve);
        }
        else {
            resolve(model, 0);
        }
    };
    BindingContext.prototype.execute = function (observer, offset) {
        var _this = this;
        var context = this.context;
        var tpl = this.tpl;
        var modelAccessor = !!tpl.modelAccessor ? tpl.modelAccessor : Xania.identity;
        observer.subscribe(context, BindingContext.update, modelAccessor, function (model, idx) {
            if (typeof idx == "undefined")
                throw new Error("model idx is not defined");
            var result = Xania.assign({}, context, model);
            var child = tpl.bind(result, idx).init(observer);
            _this.bindings.push(child);
            _this.addChild(child, idx, offset);
        });
    };
    return BindingContext;
})();
var Binding = (function () {
    function Binding(context, idx) {
        this.context = context;
        this.idx = idx;
    }
    Binding.prototype.init = function (observer) {
        throw new Error("Abstract method Binding.update");
    };
    Binding.prototype.addChild = function (child, idx) {
        throw new Error("Abstract method Binding.update");
    };
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
            if (deps.hasOwnProperty(property))
                deps[property].push(subsriber);
            else
                deps[property] = [subsriber];
        }
        else {
            var deps = {};
            deps[property] = [subsriber];
            this.subscriptions.set(object, deps);
        }
        return this;
    };
    Observer.prototype.get = function (object, property) {
        if (!this.subscriptions.has(object))
            return [];
        var deps = this.subscriptions.get(object);
        var result = [];
        if (deps.hasOwnProperty(property) || deps.hasOwnProperty("*"))
            result.push.apply(result, deps[property]);
        return result;
    };
    Observer.prototype.subscribe = function (context, update) {
        var additionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            additionalArgs[_i - 2] = arguments[_i];
        }
        var self = this;
        var observable = Xania.observe(context, {
            setRead: function (obj, property) {
                self.add(obj, property, {
                    notify: function () {
                        update.apply(this, [context].concat(additionalArgs));
                    }
                });
            },
            setChange: function (obj, property) {
                throw new Error("invalid change");
            }
        });
        update.apply(this, [observable].concat(additionalArgs));
    };
    Observer.prototype.observe = function (context, subsriber) {
        var self = this;
        return Xania.observe(context, {
            setRead: function (obj, property) {
                self.add(obj, property, subsriber);
            },
            setChange: function (obj, property) {
                throw new Error("invalid change");
            }
        });
    };
    Observer.prototype.track = function (context) {
        var self = this;
        return Xania.observe(context, {
            setRead: function () {
            },
            setChange: function (obj, property) {
                var subscribers = self.get(obj, property);
                for (var i = 0; i < subscribers.length; i++) {
                    self.dirty.add(subscribers[i]);
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
    function ContentBinding(tpl, context, idx) {
        _super.call(this, context, idx);
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
    return ContentBinding;
})(Binding);
var TagBinding = (function (_super) {
    __extends(TagBinding, _super);
    function TagBinding(tpl, context, idx) {
        _super.call(this, context, idx);
        this.tpl = tpl;
        this.children = [];
    }
    TagBinding.prototype.init = function (observer) {
        var _this = this;
        if (observer === void 0) { observer = new Observer(); }
        var updateTag = function (context, tpl) {
            if (typeof _this.dom === "undefined") {
                _this.dom = document.createElement(tpl.name);
            }
            var elt = _this.dom;
            var attributes = tpl.executeAttributes(context);
            for (var attrName in attributes) {
                if (attributes.hasOwnProperty(attrName)) {
                    if (attrName === "value") {
                        elt["value"] = attributes[attrName];
                    }
                    else {
                        var domAttr = elt.attributes[attrName];
                        if (!!domAttr) {
                            domAttr.nodeValue = attributes[attrName];
                            domAttr.value = attributes[attrName];
                        }
                        else {
                            domAttr = document.createAttribute(attrName);
                            domAttr.value = attributes[attrName];
                            elt.setAttributeNode(domAttr);
                        }
                    }
                }
            }
        };
        observer.subscribe(this.context, updateTag, this.tpl);
        var bindingContexts = this.tpl.children().map(function (tpl) { return new BindingContext(tpl, _this.context, function (child, idx, bcIndex) {
            var offset = 0;
            for (var i = 0; i < bcIndex; i++) {
                offset += bindingContexts[i].bindings.length;
            }
            _this.addChild(child, offset + idx);
        }); });
        for (var e = 0; e < bindingContexts.length; e++) {
            bindingContexts[e].execute(observer, e);
        }
        return this;
    };
    TagBinding.prototype.addChild = function (child, idx) {
        child.parent = this;
        this.children.push(child);
        if (idx >= this.dom.childNodes.length) {
            this.dom.appendChild(child.dom);
        }
        else {
            this.dom.insertBefore(child.dom, this.dom.childNodes[idx]);
        }
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