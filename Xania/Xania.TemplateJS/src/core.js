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
    TextTemplate.prototype.bind = function () {
        return new TextBinding(this);
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
    ContentTemplate.prototype.bind = function () {
        return new ContentBinding(this);
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
    TagTemplate.prototype.bind = function () {
        return new TagBinding(this);
    };
    TagTemplate.prototype.select = function (modelAccessor) {
        this.modelAccessor = modelAccessor;
        return this;
    };
    TagTemplate.prototype.executeAttributes = function (context, dom, resolve) {
        var classes = [];
        this.attributes.forEach(function (tpl, name) {
            var value = tpl.execute(context);
            if (name === "class") {
                classes.push(value);
            }
            else if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    classes.push(className);
                }
            }
            else {
                resolve(name, value, dom);
            }
        });
        if (classes.length > 0)
            resolve("class", Xania.join(" ", classes), dom);
    };
    TagTemplate.prototype.executeEvents = function (context) {
        var result = {}, self = this;
        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
        }
        this.events.forEach(function (callback, eventName) {
            result[eventName] = function () { callback.apply(self, [context].concat(arguments)); };
        });
        return result;
    };
    return TagTemplate;
})();
var Xania = (function () {
    function Xania() {
    }
    Xania.identity = function (x) {
        return x;
    };
    Xania.ready = function (data, resolve) {
        //var args = new Array(arguments.length);
        //for (var i = 1; i < args.length; i++) {
        //    args[i - 1] = arguments[i];
        //}
        //args[args.length - 1] = data;
        if (data !== null && data !== undefined && typeof (data.then) === "function")
            return data.then(resolve);
        if (typeof (resolve.execute) === "function")
            return resolve.execute.call(resolve, data);
        return resolve.call(resolve, data);
    };
    Xania.map = function (fn, data) {
        if (data === null || data === undefined) {
            return Xania.empty;
        }
        else if (typeof data.then === "function") {
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
                        observer.addDependency(arr, "length", arr.length);
                        return function (item) {
                            for (var i = 0; i < arr.length; i++) {
                                if (Xania.id(item) === Xania.id(arr[i]))
                                    return i;
                            }
                            return -1;
                        };
                    case "length":
                        observer.addDependency(arr, "length", arr.length);
                        return arr.length;
                    case "constructor":
                        return Array;
                    case "concat":
                        return function (append) {
                            return arr.concat(append);
                        };
                    case "splice":
                    case "some":
                    case "every":
                    case "slice":
                    case "filter":
                    case "map":
                    case "pop":
                    case "push":
                        observer.addDependency(arr, "length", arr.length);
                        return Xania.observeProperty(arr, property, arr[property], observer);
                    default:
                        if (arr.hasOwnProperty(property))
                            return Xania.observeProperty(arr, property, arr[property], observer);
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
                        return Xania.observeProperty(object, property, object[property], observer);
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
    Xania.observeProperty = function (object, prop, value, observer) {
        if (typeof value === "function") {
            var proxy = Xania.observe(object, observer);
            return function () {
                return Xania.observeFunction(proxy, value, observer, arguments);
            };
        }
        else {
            observer.addDependency(Xania.id(object), prop, value);
            return Xania.observe(value, observer);
        }
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
    function Binding() {
        this.subscriptions = [];
    }
    Binding.prototype.addChild = function (child, idx) {
        throw new Error("Abstract method Binding.update");
    };
    return Binding;
})();
var Observer = (function () {
    function Observer() {
        this.dependencies = new Map();
        this.dirty = new Set();
        this.state = {};
    }
    Observer.prototype.add = function (object, property, value, subsriber) {
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
    Observer.prototype.subscribe = function (binding) {
        var additionalArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            additionalArgs[_i - 1] = arguments[_i];
        }
        var observer = this;
        var subscription = {
            context: null,
            state: undefined,
            dependencies: [],
            addDependency: function (object, property, value) {
                if (observer.add(object, property, value, this)) {
                    this.dependencies.push({ object: object, property: property });
                }
            },
            setChange: function (obj, property) {
                throw new Error("invalid change");
            },
            update: function (context) {
                this.context = context.subscribe(this);
                this.notify();
                return this;
            },
            execute: function (state) {
                var key = additionalArgs.length;
                var args = Observer.cache[key];
                if (!args) {
                    Observer.cache[key] = args = new Array(3 + additionalArgs.length);
                    console.debug("create cache array ", key);
                }
                args[0] = this.context;
                args[1] = this;
                args[2] = state;
                for (var i = additionalArgs.length - 1; i >= 0; i--)
                    args[i + 3] = additionalArgs[i];
                this.state = binding.execute.apply(binding, args);
            },
            notify: function () {
                observer.unsubscribe(this);
                return Xania.ready(this.state, this);
            },
            then: function (resolve) {
                return Xania.ready(this.state, resolve);
            }
        };
        return subscription;
    };
    Observer.prototype.addDependency = function (obj, property) {
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
    Observer.cache = [];
    return Observer;
})();
var ContentBinding = (function (_super) {
    __extends(ContentBinding, _super);
    function ContentBinding(tpl) {
        _super.call(this);
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
    function TextBinding(tpl) {
        _super.call(this);
        this.tpl = tpl;
        this.dom = document.createTextNode("");
    }
    TextBinding.prototype.execute = function (context) {
        var newValue = this.tpl.execute(context);
        if (newValue !== this.value) {
            this.value = newValue;
            this.dom.textContent = newValue;
        }
    };
    return TextBinding;
})(Binding);
var TagBinding = (function (_super) {
    __extends(TagBinding, _super);
    function TagBinding(tpl) {
        _super.call(this);
        this.tpl = tpl;
        this.dom = document.createElement(tpl.name);
        this.dom.attributes["__binding"] = this;
    }
    TagBinding.prototype.execute = function (context) {
        var tpl = this.tpl;
        tpl.executeAttributes(context, this.dom, TagBinding.executeAttribute);
        return this.dom;
    };
    TagBinding.executeAttribute = function (attrName, newValue, dom) {
        if (dom.attributes["__value"] === newValue)
            return;
        dom.attributes["__value"] = newValue;
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
    };
    return TagBinding;
})(Binding);
var ObservableValue = (function () {
    function ObservableValue(value, observer) {
        this.value = value;
        this.observer = observer;
        this.$id = Xania.id(value);
    }
    Object.defineProperty(ObservableValue.prototype, "length", {
        get: function () {
            if (this.value === null || this.value === undefined)
                return 0;
            var length = this.value.length;
            if (typeof length === "number")
                return length;
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    ObservableValue.prototype.apply = function (context) {
        if (!!this.value && typeof this.value.apply === "function") {
            var value = this.value.apply(context, arguments);
            if (value !== null && value !== undefined) {
                return new ObservableValue(value.valueOf(), this.observer);
            }
            return value;
        }
        throw new Error("is not a function");
    };
    ObservableValue.prototype.prop = function (name) {
        var value = this.value[name];
        this.observer.addDependency(this.$id, name, value);
        if (this.value === null || this.value === undefined)
            return null;
        return new ObservableValue(value, this.observer);
    };
    ObservableValue.prototype.map = function (fn) {
        return Xania.map(fn, this.value);
    };
    ObservableValue.prototype.valueOf = function () {
        return this.value;
    };
    return ObservableValue;
})();
var Observable = (function () {
    function Observable($id, objects, observer) {
        if (observer === void 0) { observer = null; }
        this.$id = $id;
        this.objects = objects;
        this.observer = observer;
    }
    Observable.prototype.prop = function (name) {
        for (var i = 0; i < this.objects.length; i++) {
            var object = this.objects[i];
            var value = object[name];
            if (value !== null && value !== undefined) {
                if (typeof value.apply !== "function") {
                    this.observer.addDependency(Xania.id(object), name, value);
                }
                return new ObservableValue(value.valueOf(), this.observer);
            }
        }
        return undefined;
    };
    Observable.prototype.extend = function (object) {
        if (!object) {
            return this;
        }
        if (object instanceof Observable)
            return new Observable(object, object.objects.concat(this.objects));
        if (object instanceof ObservableValue) {
            var inner = object.value;
            return new Observable(inner, [inner].concat(this.objects));
        }
        return new Observable(object, [object].concat(this.objects));
    };
    Observable.prototype.reset = function (object) {
        this.objects[0] = object;
        return this;
    };
    Observable.prototype.subscribe = function (observer) {
        if (this.observer === observer)
            return this;
        return new Observable(this.$id, this.objects, observer);
    };
    return Observable;
})();
var Binder = (function () {
    function Binder(viewModel, lib, target) {
        this.observer = new Observer();
        this.rootContext = new Observable(viewModel, [viewModel].concat(lib), null);
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
        for (var idx = bindings.length - 1; idx >= 0; idx--) {
            var binding = bindings[idx];
            for (var s = 0; s < binding.subscriptions.length; s++) {
                var result = context.extend(arr[idx]);
                binding.subscriptions[s].update(result);
            }
        }
    };
    Binder.prototype.addBindings = function (arr, offset, tpl, context) {
        var newBindings = [];
        var children = tpl.children();
        var reduceContext = { context: null, offset: 0, parentBinding: null, binder: this };
        for (var idx = offset; idx < arr.length; idx++) {
            var newBinding = tpl.bind();
            newBindings.push(newBinding);
            var tagSubscription = this.observer.subscribe(newBinding);
            var result = context.extend(arr[idx]);
            tagSubscription.update(result);
            newBinding.subscriptions.push(tagSubscription);
            reduceContext.context = result;
            reduceContext.parentBinding = newBindings[idx];
            reduceContext.offset = 0;
            children.reduce(Binder.reduceChild, reduceContext);
        }
        return newBindings;
    };
    Binder.reduceChild = function (prev, cur) {
        var parentBinding = prev.parentBinding;
        var context = prev.context;
        var binder = prev.binder;
        prev.offset = Xania.ready(prev.offset, function (p) {
            var subscr = binder.subscribe(context, cur, parentBinding.dom, p);
            parentBinding.subscriptions.push(subscr);
            return subscr.then(function (x) { return p + x.bindings.length; });
        });
        return prev;
    };
    Binder.prototype.executeArray = function (context, arr, offset, tpl, target, bindings) {
        Binder.removeBindings(target, bindings, arr.length);
        Binder.updateBindings(bindings, arr, context);
        if (arr.length > bindings.length) {
            var newBindings = this.addBindings(arr, bindings.length, tpl, context);
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
    Binder.prototype.execute = function (observable, subscription, state, tpl, target, offset) {
        var _this = this;
        var bindings = !!state ? state.bindings : Xania.empty;
        if (!!tpl.modelAccessor) {
            return Xania.ready(tpl.modelAccessor.execute(observable), function (model) {
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
        return this.observer.subscribe(this, tpl, target, offset).update(context);
    };
    Binder.find = function (selector) {
        if (typeof selector === "string")
            return document.querySelector(selector);
        return selector;
    };
    Binder.prototype.bind = function (templateSelector, targetSelector) {
        var target = Binder.find(targetSelector) || document.body;
        var template = this.parseDom(Binder.find(templateSelector));
        this.subscribe(this.rootContext, template, target);
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
