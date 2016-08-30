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
        return this.tpl.execute(context);
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
    TagTemplate.prototype.attr = function (name, tpl) {
        return this.addAttribute(name, tpl);
    };
    TagTemplate.prototype.addAttribute = function (name, tpl) {
        this.attributes.set(name.toLowerCase(), tpl);
        return this;
    };
    TagTemplate.prototype.hasAttribute = function (name) {
        var key = name.toLowerCase();
        return this.attributes.has(key);
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
            var value = tpl.execute(context);
            if (name === "class") {
                result["class"].push(value);
            }
            else if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    result["class"].push(className);
                }
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
            then: function () {
                var resolve = arguments[0];
                var args = new Array(arguments.length);
                for (var i = 1; i < args.length; i++) {
                    args[i - 1] = arguments[i];
                }
                args[args.length - 1] = data;
                var result = resolve.apply(this, args);
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
        if (!target)
            return target;
        if (target.isSpy) {
            if (target.$observer === observer)
                return target;
            target = target.valueOf();
        }
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
                    case "$id":
                        return arr;
                    case "$observer":
                        return observer;
                    case "isSpy":
                        return true;
                    case "valueOf":
                        return arr.valueOf.bind(arr);
                    case "indexOf":
                        observer.setRead(arr, "length");
                        return function (item) {
                            for (var i = 0; i < arr.length; i++) {
                                if (Xania.id(item) === Xania.id(arr[i]))
                                    return i;
                            }
                            return -1;
                        };
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
                        observer.setRead(arr, "length");
                        return Xania.observeProperty(arr, property, observer);
                    default:
                        if (arr.hasOwnProperty(property))
                            return Xania.observeProperty(arr, property, observer);
                        return undefined;
                }
            },
            set: function (target, property, value, receiver) {
                if (Xania.id(arr[property]) !== Xania.id(value)) {
                    var length = arr.length;
                    arr[property] = value;
                    observer.setChange(Xania.id(arr), property);
                    if (arr.length !== length)
                        observer.setChange(Xania.id(arr), "length");
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
                    case "$id":
                        return object;
                    case "$observer":
                        return observer;
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
                if (Xania.id(object[property]) !== Xania.id(value)) {
                    object[property] = value;
                    observer.setChange(Xania.id(object), property);
                }
                return true;
            }
        });
    };
    Xania.observeFunction = function (object, func, observer, args) {
        var retval = func.apply(object, args);
        return Xania.observe(retval, observer);
    };
    Xania.observeProperty = function (object, propertyName, observer) {
        var propertyValue = object[propertyName];
        if (typeof propertyValue === "function") {
            var proxy = Xania.observe(object, observer);
            return function () {
                return Xania.observeFunction(proxy, propertyValue, observer, arguments);
            };
        }
        else {
            observer.setRead(Xania.id(object), propertyName);
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
    Xania.id = function (object) {
        if (object === null || object === undefined)
            return object;
        var id = object.$id;
        if (id === undefined)
            return object;
        if (typeof id === "function")
            return id();
        else
            return id;
    };
    Xania.empty = [];
    Xania.assign = Object.assign;
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
        this.subscriptions = [];
    }
    Binding.prototype.addChild = function (child, idx) {
        throw new Error("Abstract method Binding.update");
    };
    Binding.prototype.update = function (context) { throw new Error("Not implemented"); };
    return Binding;
})();
var Observer = (function () {
    function Observer() {
        this.dependencies = new Map();
        this.dirty = new Set();
        this.state = {};
    }
    Observer.prototype.add = function (object, property, subsriber) {
        var properties = this.dependencies.get(object);
        if (!!properties) {
            var subscriptions_1 = properties.get(property);
            if (!!subscriptions_1) {
                if (!subscriptions_1.has(subsriber)) {
                    subscriptions_1.add(subsriber);
                    return true;
                }
            }
            else {
                subscriptions_1 = new Set().add(subsriber);
                properties.set(property, subscriptions_1);
                return true;
            }
        }
        else {
            var subscriptions = new Set().add(subsriber);
            properties = new Map().set(property, subscriptions);
            this.dependencies.set(object, properties);
            return true;
        }
        return false;
    };
    Observer.prototype.get = function (object, property) {
        var properties = this.dependencies.get(object);
        if (!properties)
            return null;
        return properties.get(property);
    };
    Observer.prototype.unsubscribe = function (subscription) {
        while (subscription.dependencies.length > 0) {
            var dep = subscription.dependencies.pop();
            var properties = this.dependencies.get(dep.object);
            if (!!properties) {
                var subscriptions = properties.get(dep.property);
                if (!!subscriptions) {
                    subscriptions.delete(subscription);
                    if (subscriptions.size === 0) {
                        properties.delete(dep.property);
                        if (properties.size === 0) {
                            this.dependencies.delete(dep.object);
                        }
                    }
                }
            }
        }
        this.dirty.delete(subscription);
    };
    Observer.prototype.subscribe = function (initial, binding) {
        var additionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            additionalArgs[_i - 2] = arguments[_i];
        }
        var observer = this;
        var subscription = {
            context: initial,
            parent: undefined,
            state: undefined,
            dependencies: [],
            setRead: function (object, property) {
                if (observer.add(object, property, this)) {
                    this.dependencies.push({ object: object, property: property });
                }
            },
            setChange: function (obj, property) {
                throw new Error("invalid change");
            },
            update: function (context) {
                this.context = context;
                this.notify();
            },
            stateReady: function (state) {
                var observable = Xania.observe(this.context, this);
                this.state = binding.execute.apply(binding, [observable, this, state].concat(additionalArgs));
            },
            notify: function () {
                observer.unsubscribe(this);
                return Xania.promise(this.state).then(this.stateReady.bind(this));
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
            }
        };
        subscription.notify();
        return subscription;
    };
    Observer.prototype.setRead = function (obj, property) {
    };
    Observer.prototype.setChange = function (obj, property) {
        var _this = this;
        var subscribers = this.get(obj, property);
        if (!!subscribers) {
            subscribers.forEach(function (s) {
                _this.dirty.add(s);
            });
        }
    };
    Observer.prototype.track = function (context) {
        return Xania.observe(context, this);
    };
    Observer.prototype.update = function () {
        if (this.dirty.size > 0) {
            this.dirty.forEach(function (subscriber) {
                subscriber.notify();
            });
            this.dirty.clear();
        }
    };
    return Observer;
})();
var ContentBinding = (function (_super) {
    __extends(ContentBinding, _super);
    function ContentBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
        this.dom = document.createDocumentFragment();
    }
    ContentBinding.prototype.execute = function (context) {
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
        this.context = context;
        this.execute(context);
    };
    TextBinding.prototype.execute = function (context) {
        this.dom.textContent = this.tpl.execute(context);
    };
    return TextBinding;
})(Binding);
var TagBinding = (function (_super) {
    __extends(TagBinding, _super);
    function TagBinding(tpl, context) {
        _super.call(this, context);
        this.tpl = tpl;
        this.dom = document.createElement(tpl.name);
        this.dom.attributes["__binding"] = this;
    }
    TagBinding.prototype.update = function (context) {
        this.context = context;
    };
    TagBinding.prototype.execute = function (context) {
        var tpl = this.tpl;
        var dom = this.dom;
        var attributes = tpl.executeAttributes(context);
        for (var attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var newValue = Xania.join(" ", attributes[attrName]);
                if (dom.attributes.hasOwnProperty(attrName) && dom[attrName] === newValue)
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
    return TagBinding;
})(Binding);
var Binder = (function () {
    function Binder(model, target) {
        if (target === void 0) { target = null; }
        this.model = model;
        this.observer = new Observer();
        Xania.assign(model, Fun.List);
        this.compiler = new Ast.Compiler();
        this.compile = this.compiler.template.bind(this.compiler);
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
            if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && !tagElement.hasAttribute("value")) {
                var valueAccessor = this.compile("{{ " + attr.value + " }}");
                tagElement.attr("value", valueAccessor);
            }
        }
    };
    Binder.updateSubscription = function (observable, subscription, state) {
        if (state === void 0) { state = { bindings: [] }; }
    };
    Binder.removeBindings = function (target, bindings, maxLength) {
        while (bindings.length > maxLength) {
            var oldBinding = bindings.pop();
            target.removeChild(oldBinding.dom);
        }
    };
    Binder.updateBindings = function (bindings, arr, context) {
        for (var idx = 0; idx < bindings.length; idx++) {
            var binding = bindings[idx];
            var result = !!arr[idx] ? Xania.assign({}, context, arr[idx]) : context;
            binding.context = result;
            for (var s = 0; s < binding.subscriptions.length; s++) {
                binding.subscriptions[s].update(result);
            }
        }
    };
    Binder.prototype.addBindings = function (arr, offset, tpl, context) {
        var newBindings = [];
        for (var idx = offset; idx < arr.length; idx++) {
            var result = !!arr[idx] ? Xania.assign({}, context, arr[idx]) : context;
            var newBinding = tpl.bind(result);
            newBindings.push(newBinding);
            var tagSubscription = this.observer.subscribe(result, newBinding);
            newBinding.subscriptions.push(tagSubscription);
        }
        return newBindings;
    };
    Binder.prototype.executeChild = function (parentBinding, cur, p) {
        var subscr = this.subscribe(parentBinding.context, cur, parentBinding.dom, p);
        parentBinding.subscriptions.push(subscr);
        return subscr.then(function (x) { return p + x.bindings.length; });
    };
    Binder.prototype.reduceChild = function (prev, cur) {
        var parentBinding = prev.parentBinding;
        var offset = Xania.promise(prev.offset)
            .then(this.executeChild.bind(this, parentBinding, cur));
        return { offset: offset, parentBinding: parentBinding };
    };
    Binder.prototype.executeArray = function (context, arr, offset, tpl, target, bindings) {
        Binder.removeBindings(target, bindings, arr.length);
        Binder.updateBindings(bindings, arr, context);
        if (arr.length > bindings.length) {
            var newBindings = this.addBindings(arr, bindings.length, tpl, context);
            for (var i = 0; i < newBindings.length; i++) {
                var children = tpl.children();
                children.reduce(this.reduceChild.bind(this), { offset: 0, parentBinding: newBindings[i] });
            }
            var insertAt = offset + bindings.length;
            if (insertAt < target.childNodes.length) {
                var beforeElement = target.childNodes[insertAt];
                for (var i = 0; i < newBindings.length; i++)
                    target.insertBefore(newBindings[i].dom, beforeElement);
            }
            else {
                for (var i = 0; i < newBindings.length; i++)
                    target.appendChild(newBindings[i].dom);
            }
            return bindings.concat(newBindings);
        }
        return bindings;
    };
    Binder.prototype.modelReady = function (subscription, offset, tpl, target, bindings, model) {
        if (model === null || model === undefined)
            return { bindings: [] };
        var arr = Array.isArray(model) ? model : [model];
        return { bindings: this.executeArray(subscription.context, arr, offset, tpl, target, bindings) };
    };
    Binder.prototype.execute = function (observable, subscription, state, tpl, target, offset) {
        var _this = this;
        var bindings = !!state ? state.bindings : Xania.empty;
        if (!!tpl.modelAccessor) {
            return Xania.promise(tpl.modelAccessor.execute(observable))
                .then(function (model) {
                if (model === null || model === undefined)
                    return { bindings: [] };
                var arr = Array.isArray(model) ? model : [model];
                return { bindings: _this.executeArray(subscription.context, arr, offset, tpl, target, bindings) };
            });
        }
        else {
            return { bindings: this.executeArray(subscription.context, [null], offset, tpl, target, bindings) };
        }
    };
    Binder.prototype.subscribe = function (context, tpl, target, offset) {
        if (offset === void 0) { offset = 0; }
        return this.observer.subscribe(context, this, tpl, target, offset);
    };
    Binder.find = function (selector) {
        if (typeof selector === "string")
            return document.querySelector(selector);
        return selector;
    };
    Binder.prototype.bind = function (templateSelector, targetSelector) {
        var target = Binder.find(targetSelector) || document.body;
        var template = this.parseDom(Binder.find(templateSelector));
        this.subscribe(this.model, template, target);
        return this;
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
                var textContent = node.textContent;
                if (textContent.trim().length > 0) {
                    var tpl = this.compile(textContent);
                    push(new TextTemplate(tpl || node.textContent));
                }
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
