var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TextTemplate = (function () {
    function TextTemplate(tpl) {
        this.tpl = tpl;
    }
    TextTemplate.prototype.execute = function (context) {
        return typeof this.tpl == "function"
            ? this.tpl(context)
            : this.tpl;
    };
    TextTemplate.prototype.bind = function (model) {
        return new TextBinding(this, model);
    };
    TextTemplate.prototype.toString = function () {
        return this.tpl.toString();
    };
    TextTemplate.prototype.children = function () {
        return [];
    };
    return TextTemplate;
})();
var ContentTemplate = (function () {
    function ContentTemplate() {
        this._children = [];
    }
    ContentTemplate.prototype.bind = function (model, idx) {
        return new ContentBinding(this, model);
    };
    ContentTemplate.prototype.children = function () {
        return this._children;
    };
    ContentTemplate.prototype.addChild = function (child) {
        this._children.push(child);
        return this;
    };
    return ContentTemplate;
})();
var TagTemplate = (function () {
    function TagTemplate(name) {
        this.name = name;
        this.attributes = new Map();
        this.events = new Map();
        this._children = [];
    }
    TagTemplate.prototype.children = function () {
        return this._children;
    };
    TagTemplate.prototype.attr = function (name, value) {
        return this.addAttribute(name, value);
    };
    TagTemplate.prototype.addAttribute = function (name, value) {
        var tpl = typeof (value) === "function"
            ? value
            : function () { return value; };
        this.attributes.set(name, tpl);
        return this;
    };
    TagTemplate.prototype.addEvent = function (name, callback) {
        this.events.set(name, callback);
    };
    TagTemplate.prototype.addChild = function (child) {
        this._children.push(child);
        return this;
    };
    TagTemplate.prototype.bind = function (model) {
        return new TagBinding(this, model);
    };
    TagTemplate.prototype.select = function (modelAccessor) {
        this.modelAccessor = modelAccessor;
        return this;
    };
    TagTemplate.prototype.executeAttributes = function (context) {
        var result = {
            "class": []
        };
        this.attributes.forEach(function (tpl, name) {
            var value = tpl(context);
            if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    result["class"].push(className);
                }
            }
            else if (name === "class") {
                var cls = value.split(" ");
                result["class"].push.apply(result["class"], cls);
            }
            else {
                result[name] = value;
            }
        });
        return result;
    };
    TagTemplate.prototype.executeEvents = function (context) {
        var _this = this;
        var result = {};
        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
        }
        this.events.forEach(function (callback, eventName) {
            result[eventName] = callback.bind(_this, context);
        });
        return result;
    };
    return TagTemplate;
})();
var SelectManyExpression = (function () {
    function SelectManyExpression(varName, viewModel, collectionExpr, loader) {
        this.varName = varName;
        this.viewModel = viewModel;
        this.collectionExpr = collectionExpr;
        this.loader = loader;
        this.items = [];
        if (collectionExpr === undefined || collectionExpr === null) {
            throw new Error("null argument exception");
        }
    }
    SelectManyExpression.prototype.execute = function (context) {
        var collectionFunc = new Function("m", "with(m) { return " + this.collectionExpr + "; }"), varName = this.varName;
        if (Array.isArray(context))
            throw new Error("context is Array");
        var col = collectionFunc(context);
        return Xania.promise(col).then(function (data) {
            var arr = Array.isArray(data) ? data : [data];
            var results = [];
            for (var i = 0; i < arr.length; i++) {
                var result = {};
                result[varName] = arr[i];
                results.push(result);
            }
            return results;
        });
    };
    SelectManyExpression.parse = function (expr, loader) {
        if (loader === void 0) { loader = function (t) { return window[t]; }; }
        var m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+of\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            var varName = m[1], itemType = m[3], directive = m[5], collectionExpr = m[6];
            var viewModel = loader(itemType);
            return new SelectManyExpression(varName, viewModel, collectionExpr, loader);
        }
        return null;
    };
    SelectManyExpression.ensureIsArray = function (obj) {
        return Array.isArray(obj) ? obj : [obj];
    };
    return SelectManyExpression;
})();
var Value = (function () {
    function Value(obj) {
        this.obj = obj;
    }
    Value.prototype.valueOf = function () {
        return this.obj;
    };
    return Value;
})();
var Xania = (function () {
    function Xania() {
    }
    Xania.identity = function (x) {
        return x;
    };
    Xania.composable = function (data) {
        return data !== null && data !== undefined && typeof (data.then) === "function";
    };
    Xania.promise = function (data) {
        if (data !== null && data !== undefined && typeof (data.then) === "function") {
            return data;
        }
        return {
            then: function (resolve) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var result = resolve.apply(this, args.concat([data]));
                if (result === undefined)
                    return this;
                return Xania.promise(result);
            }
        };
    };
    Xania.map = function (fn, data) {
        if (typeof data.then === "function") {
            return data.then(function (arr) {
                Xania.map(fn, arr);
            });
        }
        else if (typeof data.map === "function") {
            data.map(fn);
        }
        else if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                fn.call(this, data[i], i, data);
            }
        }
        else {
            fn.call(this, data, 0, [data]);
        }
    };
    Xania.collect = function (fn, data) {
        if (Array.isArray(data)) {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                var items = fn.call(this, data[i]);
                Array.prototype.push.apply(result, items);
            }
            return result;
        }
        else {
            return [fn.call(this, data)];
        }
    };
    Xania.count = function (data) {
        if (data === null || typeof data === "undefined")
            return 0;
        return !!data.length ? data.length : 1;
    };
    Xania.compose = function () {
        var fns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fns[_i - 0] = arguments[_i];
        }
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                result = fns[i].call(this, result);
            }
            return result;
        };
    };
    Xania.partialFunc = function () {
        var self = this;
        var args = new Array(self.baseArgs.length + arguments.length);
        for (var i = 0; i < self.baseArgs.length; i++)
            args[i] = self.baseArgs[i];
        for (var n = 0; n < arguments.length; n++) {
            args[n + self.baseArgs.length] = arguments[n];
        }
        return self.func.apply(self.context, args);
    };
    Xania.partialApp = function (func) {
        var baseArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            baseArgs[_i - 1] = arguments[_i];
        }
        return Xania.partialFunc.bind({ context: this, func: func, baseArgs: baseArgs });
    };
    Xania.observe = function (target, observer) {
        if (!target || target.isSpy)
            return target;
        if (target.isSpy)
            throw new Error("observe observable is not allowed");
        if (typeof target === "object") {
            return Array.isArray(target)
                ? Xania.observeArray(target, observer)
                : Xania.observeObject(target, observer);
        }
        else {
            return target;
        }
    };
    Xania.observeArray = function (arr, observer) {
        return Xania.proxy(arr, {
            get: function (target, property) {
                switch (property) {
                    case "isSpy":
                        return true;
                    case "valueOf":
                        return arr.valueOf.bind(arr);
                    case "indexOf":
                        observer.setRead(arr, "length");
                        return arr.indexOf.bind(arr);
                    case "length":
                        observer.setRead(arr, "length");
                        return arr.length;
                    case "constructor":
                        return Array;
                    case "splice":
                    case "some":
                    case "every":
                    case "slice":
                    case "filter":
                    case "map":
                    case "pop":
                    case "push":
                        return Xania.observeProperty(arr, property, observer);
                    default:
                        if (arr.hasOwnProperty(property))
                            return Xania.observeProperty(arr, property, observer);
                        return undefined;
                }
            },
            set: function (target, property, value, receiver) {
                var unwrapped = Xania.unwrap(value);
                if (arr[property] !== unwrapped) {
                    var length = arr.length;
                    arr[property] = unwrapped;
                    observer.setChange(arr, property);
                    if (arr.length !== length)
                        observer.setChange(arr, "length");
                }
                return true;
            }
        });
    };
    Xania.unwrap = function (obj, cache) {
        if (cache === void 0) { cache = null; }
        if (obj === undefined || obj === null || typeof (obj) !== "object")
            return obj;
        if (!!cache && cache.has(obj))
            return obj;
        if (!!obj.isSpy) {
            return Xania.unwrap(obj.valueOf(), cache);
        }
        if (!cache)
            cache = new Set();
        cache.add(obj);
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = Xania.unwrap(obj[prop], cache);
            }
        }
        return obj;
    };
    Xania.observeObject = function (object, observer) {
        return Xania.proxy(object, {
            get: function (target, property) {
                switch (property) {
                    case "isSpy":
                        return true;
                    case "valueOf":
                        return function () { return object; };
                    case "constructor":
                        return object.constructor;
                    default:
                        return Xania.observeProperty(object, property, observer);
                }
            },
            set: function (target, property, value, receiver) {
                var unwrapped = Xania.unwrap(value);
                if (object[property] !== unwrapped) {
                    object[property] = unwrapped;
                    observer.setChange(object, property);
                }
                return true;
            }
        });
    };
    Xania.observeFunction = function () {
        var self = this;
        var retval = self.func.apply(self.object, arguments);
        return Xania.observe(retval, self.observer);
    };
    Xania.observeProperty = function (object, propertyName, observer) {
        var propertyValue = object[propertyName];
        if (typeof propertyValue === "function") {
            var proxy = Xania.observe(object, observer);
            return this.observeFunction.bind({ object: proxy, func: propertyValue, observer: observer });
        }
        else {
            observer.setRead(object, propertyName);
            if (propertyValue === null || typeof propertyValue === "undefined") {
                return null;
            }
            else {
                return Xania.observe(propertyValue, observer);
            }
        }
    };
    Xania.shallow = function (obj) {
        return Xania.assign({}, obj);
    };
    Xania.assign = function (target) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var i = 0; i < args.length; i++) {
            var object = args[i];
            for (var prop in object) {
                if (object.hasOwnProperty(prop)) {
                    target[prop] = object[prop];
                }
            }
        }
        return target;
    };
    Xania.proxy = function (target, config) {
        if (typeof window["Proxy"] === "undefined")
            throw new Error("Browser is not supported");
        return new (window["Proxy"])(target, config);
    };
    Xania.join = function (separator, value) {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.sort().join(separator) : null;
        }
        return value;
    };
    return Xania;
})();
var Router = (function () {
    function Router() {
        this.currentAction = null;
    }
    Router.prototype.action = function (name) {
        if (name === null || typeof name === "undefined")
            return this.currentAction;
        return this.currentAction = name;
    };
    return Router;
})();
var Binding = (function () {
    function Binding(context) {
        this.context = context;
        this.destroyed = false;
    }
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
        this.state = {};
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
            deps[property] = new Set().add(subsriber);
            this.subscriptions.set(object, deps);
            return true;
        }
        return false;
    };
    Observer.prototype.get = function (object, property) {
        if (!this.subscriptions.has(object))
            return null;
        var deps = this.subscriptions.get(object);
        if (deps.hasOwnProperty(property))
            return deps[property];
        return null;
    };
    Observer.prototype.unsubscribe = function (subscription) {
        var _this = this;
        while (subscription.dependencies.length > 0) {
            var dep = subscription.dependencies.pop();
            var deps = this.subscriptions.get(dep.obj);
            deps[dep.property].delete(subscription);
            if (deps[dep.property].size === 0) {
                delete deps[dep.property];
                if (Object.keys(deps).length === 0) {
                    this.subscriptions.delete(dep.obj);
                }
            }
        }
        subscription.children.forEach(function (child) {
            _this.unsubscribe(child);
        });
        subscription.children.clear();
        this.dirty.delete(subscription);
    };
    Observer.prototype.subscribe = function (context, update) {
        var additionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            additionalArgs[_i - 2] = arguments[_i];
        }
        var observer = this, observable, updateArgs;
        var subscription = {
            parent: undefined,
            children: new Set(),
            state: undefined,
            dependencies: [],
            notify: function () {
                var _this = this;
                observer.unsubscribe(this);
                return Xania.promise(this.state)
                    .then(function (s) { return _this.state = update.apply(observer, updateArgs.concat([s])); });
            },
            then: function (resolve) {
                return Xania.promise(this.state).then(resolve);
            },
            subscribe: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                return observer.subscribe.apply(observer, args);
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
            state: function (name, value) {
                this.setRead(observer.state, name);
                if (value === undefined) {
                    return observer.state[name];
                }
                else {
                    return observer.state[name] === value;
                }
            },
            setRead: function (obj, property) {
                if (observer.add(obj, property, subscription)) {
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
            state: function (name, value) {
                if (value !== undefined) {
                    this.setChange(observer.state, name);
                    observer.state[name] = value;
                }
            },
            setRead: function () {
            },
            setChange: function (obj, property) {
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
        if (this.dirty.size > 0) {
            var observer = this;
            window.requestAnimationFrame(function () {
                observer.dirty.forEach(function (subscriber) {
                    subscriber.notify();
                });
                observer.dirty.clear();
            });
        }
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
        this.dom = document.createDocumentFragment();
    }
    ContentBinding.prototype.render = function (context) {
        return this.dom;
    };
    return ContentBinding;
})(Binding);
var TextBinding = (function (_super) {
    __extends(TextBinding, _super);
    function TextBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
        this.dom = document.createTextNode("");
    }
    TextBinding.prototype.update = function (context) {
        this.dom.textContent = this.tpl.execute(context);
    };
    TextBinding.prototype.destroy = function () {
        if (!!this.dom) {
            this.dom.remove();
        }
        this.destroyed = true;
    };
    TextBinding.prototype.render = function (context) {
        this.dom.textContent = this.tpl.execute(context);
    };
    return TextBinding;
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
        return dom;
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
    function Binder(model, target) {
        if (target === void 0) { target = null; }
        this.model = model;
        this.observer = new Observer();
        Xania.assign(model, Fun.List);
        var compiler = new Ast.Compiler();
        this.compile = compiler.template.bind(compiler);
        this.target = target || document.body;
        this.init();
    }
    Binder.prototype.import = function (templateUrl) {
        var binder = this;
        if (!("import" in document.createElement("link"))) {
            throw new Error("HTML import is not supported in this browser");
        }
        return {
            then: function (resolve) {
                var link = document.createElement('link');
                link.rel = 'import';
                link.href = templateUrl;
                link.setAttribute('async', '');
                link.onload = function (e) {
                    var link = e.target;
                    resolve.call(binder, link.import);
                };
                document.head.appendChild(link);
            }
        };
    };
    Binder.prototype.parseAttr = function (tagElement, attr) {
        var name = attr.name;
        if (name === "click" || name.startsWith("keyup.")) {
            var fn = this.compile(attr.value);
            tagElement.addEvent(name, fn);
        }
        else if (name === "data-select" || name === "data-from") {
            var fn = this.compile(attr.value);
            tagElement.select(fn);
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
    Binder.prototype.execute = function (rootContext, rootTpl, rootTarget) {
        var _this = this;
        var visit = function (parent, context, tpl, target, offset) {
            return _this.observer.subscribe(context, function (observable, subscription, state) {
                if (state === void 0) { state = { length: 0 }; }
                var visitArray = function (arr) {
                    var prevLength = state.length;
                    for (var e = prevLength - 1; e >= 0; e--) {
                        var idx = offset + e;
                        target.removeChild(target.childNodes[idx]);
                    }
                    var docfrag = document.createDocumentFragment();
                    for (var idx = 0; idx < arr.length; idx++) {
                        var result = !!arr[idx] ? Xania.assign({}, context, arr[idx]) : context;
                        var binding = tpl.bind(result);
                        _this.observer.subscribe(result, binding.render.bind(binding)).attach(subscription);
                        var visitChild = Xania.partialApp(function (data, parent, prev, cur) {
                            return Xania.promise(prev)
                                .then(function (p) {
                                return visit(subscription, data, cur, parent, p).then(function (x) { return p + x.length; });
                            });
                        }, result, binding.dom);
                        tpl.children().reduce(visitChild, 0);
                        docfrag.appendChild(binding.dom);
                    }
                    if (offset < target.childNodes.length)
                        target.insertBefore(docfrag, target.childNodes[offset]);
                    else
                        target.appendChild(docfrag);
                    return { length: arr.length };
                };
                subscription.attach(parent);
                if (!!tpl.modelAccessor) {
                    return Xania.promise(tpl.modelAccessor(observable))
                        .then(function (model) {
                        if (model === null || model === undefined)
                            return [];
                        model = Xania.unwrap(model);
                        return visitArray(Array.isArray(model) ? model : [model]);
                    });
                }
                else {
                    return visitArray([null]);
                }
            });
        };
        visit(null, rootContext, rootTpl, rootTarget, 0);
    };
    Binder.find = function (selector) {
        if (typeof selector === "string")
            return document.querySelector(selector);
        return selector;
    };
    Binder.prototype.bind = function (templateSelector, targetSelector) {
        var target = Binder.find(targetSelector) || document.body;
        var template = this.parseDom(Binder.find(templateSelector));
        this.bindTemplate(template, target);
        return this;
    };
    Binder.prototype.bindTemplate = function (tpl, target) {
        var arr = Array.isArray(this.model) ? this.model : [this.model];
        for (var i = 0; i < arr.length; i++) {
            this.execute(arr[i], tpl, target);
        }
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
            if (!!node["content"]) {
                var content = node["content"];
                var template = new ContentTemplate();
                for (i = content.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: content.childNodes[i], push: template.addChild.bind(template) });
                }
                push(template);
            }
            else if (node.nodeType === 1) {
                var elt = node;
                var template_1 = new TagTemplate(elt.tagName);
                for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                    var attribute = elt.attributes[i];
                    this.parseAttr(template_1, attribute);
                }
                for (i = elt.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: elt.childNodes[i], push: template_1.addChild.bind(template_1) });
                }
                push(template_1);
            }
            else if (node.nodeType === 3) {
                var tpl = this.compile(node.textContent);
                push(new TextTemplate(tpl || node.textContent));
            }
        }
        return rootTpl;
    };
    Binder.prototype.init = function () {
        var _this = this;
        var target = this.target;
        var eventHandler = function (target, name) {
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
        target.addEventListener("click", function (evt) { return eventHandler(evt.target, evt.type); });
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
                eventHandler(evt.target, "keyup.enter");
            }
            else {
                onchange(evt);
            }
            _this.observer.update();
        });
    };
    return Binder;
})();
