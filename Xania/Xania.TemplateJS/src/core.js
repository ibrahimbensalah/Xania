/// <reference path="../scripts/typings/es6-shim/es6-shim.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Xania;
(function (Xania) {
    Xania.app = function () {
        var libs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            libs[_i - 0] = arguments[_i];
        }
        return new Application(libs);
    };
    var Application = (function () {
        function Application(libs) {
            this.libs = libs;
            this.components = new Map();
            this.observer = new Observer();
            this.binders = [];
            this.compiler = new Xania.Ast.Compiler();
            this.compile = this.compiler.template.bind(this.compiler);
        }
        Application.prototype.component = function (component) {
            this.components.set(component.name.toLowerCase(), component);
            return this;
        };
        Application.prototype.start = function () {
            var stack = [document.body];
            while (stack.length > 0) {
                var dom = stack.pop();
                var component = this.getComponent(dom.nodeName);
                if (component === false) {
                    for (var i = 0; i < dom.childNodes.length; i++) {
                        var child = dom.childNodes[i];
                        if (child.nodeType === 1)
                            stack.push(child);
                    }
                }
                else {
                    this.bind(dom.nodeName + ".html", component, dom);
                }
            }
            return this;
        };
        Application.prototype.listen = function (target) {
            var _this = this;
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
        Application.prototype.update = function () {
            this.observer.update();
        };
        Application.prototype.track = function (object) {
            return this.observer.track(object);
        };
        Application.prototype.getComponent = function (nodeName) {
            var name = nodeName.replace(/\-/, "").toLowerCase();
            if (!this.components.has(name)) {
                return false;
            }
            return this.components.get(name);
        };
        Application.prototype.bind = function (view, Component, target) {
            var binder = new Binder(new Component(), this.libs, this.observer);
            this.import(view).then(function (template) {
                binder.subscribe(null, template, target);
            });
            this.binders.push(binder);
            return this;
        };
        Application.prototype.import = function (templateUrl) {
            if (!("import" in document.createElement("link"))) {
                throw new Error("HTML import is not supported in this browser");
            }
            var app = this;
            return {
                then: function (resolve) {
                    var _this = this;
                    var link = document.createElement('link');
                    link.rel = 'import';
                    link.href = templateUrl;
                    link.setAttribute('async', '');
                    link.onload = function (e) {
                        var link = e.target;
                        var dom = link.import.querySelector("template");
                        resolve.call(_this, app.parseDom(dom));
                    };
                    document.head.appendChild(link);
                }
            };
        };
        Application.prototype.parseDom = function (rootDom) {
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
        Application.prototype.parseAttr = function (tagElement, attr) {
            var name = attr.name;
            if (name === "click" || name.match(/keyup\./)) {
                var fn = this.compile(attr.value);
                tagElement.addEvent(name, fn);
            }
            else if (name === "data-select" || name === "data-from") {
                var fn = this.compile(attr.value);
                tagElement.select(fn);
            }
            else if (name === "checked") {
                var fn = this.compile(attr.value);
                tagElement.attr(name, Util.compose(function (ctx) { return !!ctx ? "checked" : null; }, fn));
            }
            else {
                var tpl = this.compile(attr.value);
                tagElement.attr(name, tpl || attr.value);
                if (!!tagElement.name.match(/^input$/i) &&
                    !!attr.name.match(/^name$/i) &&
                    !tagElement.hasAttribute("value")) {
                    var valueAccessor = this.compile("{{ " + attr.value + " }}");
                    tagElement.attr("value", valueAccessor);
                }
            }
        };
        return Application;
    })();
    var TextTemplate = (function () {
        function TextTemplate(tpl) {
            this.tpl = tpl;
        }
        TextTemplate.prototype.execute = function (context) {
            return this.tpl.execute(context);
        };
        TextTemplate.prototype.bind = function (context) {
            return new TextBinding(this, context);
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
        ContentTemplate.prototype.bind = function (context) {
            return new ContentBinding(this, context);
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
        TagTemplate.prototype.bind = function (context) {
            return new TagBinding(this, context);
        };
        TagTemplate.prototype.select = function (modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        };
        TagTemplate.prototype.executeAttributes = function (context, dom, resolve) {
            var classes = [];
            this.attributes.forEach(function attributesForEachBoundFn(tpl, name) {
                var value = tpl.execute(context).valueOf();
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
            resolve("class", Util.join(" ", classes), dom);
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
    var Util = (function () {
        function Util() {
        }
        Util.identity = function (x) {
            return x;
        };
        Util.ready = function (data, resolve) {
            if (data !== null && data !== undefined && typeof (data.then) === "function")
                return data.then(resolve);
            if (typeof (resolve.execute) === "function")
                return resolve.execute.call(resolve, data);
            return resolve.call(resolve, data);
        };
        Util.map = function (fn, data) {
            if (data === null || data === undefined) {
                return Util.empty;
            }
            else if (typeof data.then === "function") {
                return data.then(function dataThenBoundFn(arr) {
                    return Util.map(fn, arr);
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
        Util.collect = function (fn, data) {
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
        Util.count = function (data) {
            if (data === null || typeof data === "undefined")
                return 0;
            return !!data.length ? data.length : 1;
        };
        Util.compose = function () {
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
        Util.partialFunc = function () {
            var self = this;
            var args = new Array(self.baseArgs.length + arguments.length);
            for (var i = 0; i < self.baseArgs.length; i++)
                args[i] = self.baseArgs[i];
            for (var n = 0; n < arguments.length; n++) {
                args[n + self.baseArgs.length] = arguments[n];
            }
            return self.func.apply(self.context, args);
        };
        Util.partialApp = function (func) {
            var baseArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                baseArgs[_i - 1] = arguments[_i];
            }
            return Util.partialFunc.bind({ context: this, func: func, baseArgs: baseArgs });
        };
        Util.observe = function (target, observer) {
            if (!target)
                return target;
            if (target.isSpy) {
                if (target.$observer === observer)
                    return target;
                target = target.valueOf();
            }
            if (typeof target === "object") {
                return Array.isArray(target)
                    ? Util.observeArray(target, observer)
                    : Util.observeObject(target, observer);
            }
            else {
                return target;
            }
        };
        Util.observeArray = function (arr, observer) {
            return Util.proxy(arr, {
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
                                    if (Util.id(item) === Util.id(arr[i]))
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
                            return Util.observeProperty(arr, property, arr[property], observer);
                        default:
                            if (arr.hasOwnProperty(property))
                                return Util.observeProperty(arr, property, arr[property], observer);
                            return undefined;
                    }
                },
                set: function (target, property, value) {
                    if (Util.id(arr[property]) !== Util.id(value)) {
                        var length = arr.length;
                        arr[property] = value;
                        observer.setChange(Util.id(arr), property);
                        if (arr.length !== length)
                            observer.setChange(Util.id(arr), "length");
                    }
                    return true;
                }
            });
        };
        Util.observeObject = function (object, observer) {
            return Util.proxy(object, {
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
                            return Util.observeProperty(object, property, object[property], observer);
                    }
                },
                set: function (target, property, value) {
                    if (Util.id(object[property]) !== Util.id(value)) {
                        object[property] = value;
                        observer.setChange(Util.id(object), property);
                    }
                    return true;
                }
            });
        };
        Util.observeFunction = function (object, func, observer, args) {
            var retval = func.apply(object, args);
            return Util.observe(retval, observer);
        };
        Util.observeProperty = function (object, prop, value, observer) {
            if (typeof value === "function") {
                var proxy = Util.observe(object, observer);
                return function () {
                    return Util.observeFunction(proxy, value, observer, arguments);
                };
            }
            else {
                observer.addDependency(Util.id(object), prop, value);
                return Util.observe(value, observer);
            }
        };
        Util.proxy = function (target, config) {
            if (typeof window["Proxy"] === "undefined")
                throw new Error("Browser is not supported");
            return new (window["Proxy"])(target, config);
        };
        Util.join = function (separator, value) {
            if (Array.isArray(value)) {
                return value.length > 0 ? value.sort().join(separator) : null;
            }
            return value;
        };
        Util.id = function (object) {
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
        Util.empty = [];
        return Util;
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
        Binding.prototype.update = function (context) {
            this.context = context;
            for (var s = 0; s < this.subscriptions.length; s++) {
                this.subscriptions[s].notify();
            }
        };
        return Binding;
    })();
    var Observer = (function () {
        function Observer() {
            this.all = new Set();
            this.state = {};
        }
        Observer.prototype.unsubscribe = function (subscription) {
            this.all.delete(subscription);
        };
        Observer.prototype.subscribe = function (binding) {
            var additionalArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                additionalArgs[_i - 1] = arguments[_i];
            }
            var observer = this;
            var subscription = {
                binding: binding,
                state: undefined,
                dependencies: [],
                addDependency: function (object, property, value) {
                    this.dependencies.push({ object: object, property: property, value: value });
                },
                hasDependency: function (object, property) {
                    for (var i = 0; i < this.dependencies.length; i++) {
                        var dep = this.dependencies[i];
                        if (dep.object === object && dep.property === property)
                            return true;
                    }
                    return false;
                },
                hasChanges: function () {
                    for (var i = 0; i < this.dependencies.length; i++) {
                        var dep = this.dependencies[i];
                        var value = dep.object[dep.property];
                        if (value !== dep.value)
                            return true;
                    }
                    return false;
                },
                setChange: function (obj, property) {
                    throw new Error("invalid change");
                },
                execute: function (state) {
                    this.state = binding.execute(binding.context.subscribe(this), state, additionalArgs);
                },
                notify: function () {
                    this.dependencies.length = 0;
                    var result = Util.ready(this.state, this);
                    if (this.dependencies.length > 0)
                        observer.all.add(this);
                    else
                        observer.unsubscribe(this);
                    return result;
                },
                then: function (resolve) {
                    return Util.ready(this.state, resolve);
                }
            };
            return subscription;
        };
        Observer.prototype.addDependency = function (obj, property) {
        };
        Observer.prototype.setChange = function (obj, property) {
        };
        Observer.prototype.track = function (context) {
            return Util.observe(context, this);
        };
        Observer.prototype.update = function () {
            this.all.forEach(function (s) {
                if (s.hasChanges()) {
                    s.notify();
                }
            });
        };
        Observer.cache = [];
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
        TextBinding.prototype.execute = function (context) {
            var newValue = this.tpl.execute(context).valueOf();
            if (newValue !== this.value) {
                this.value = newValue;
                this.dom.textContent = newValue;
            }
        };
        return TextBinding;
    })(Binding);
    var TagBinding = (function (_super) {
        __extends(TagBinding, _super);
        function TagBinding(tpl, context) {
            _super.call(this, context);
            this.tpl = tpl;
            this.attrs = {};
            this.dom = document.createElement(tpl.name);
            this.dom.attributes["__binding"] = this;
        }
        TagBinding.prototype.execute = function (context) {
            var tpl = this.tpl;
            tpl.executeAttributes(context, this, TagBinding.executeAttribute);
            return this.dom;
        };
        TagBinding.executeAttribute = function (attrName, newValue, binding) {
            if (binding.attrs[attrName] === newValue)
                return;
            binding.attrs[attrName] = newValue;
            var dom = binding.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                dom.removeAttribute(attrName);
            }
            else {
                dom[attrName] = newValue;
                if (attrName === "value") {
                    dom["value"] = newValue;
                }
                else {
                    var domAttr = document.createAttribute(attrName);
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
            this.$id = Util.id(value);
        }
        Object.defineProperty(ObservableValue.prototype, "length", {
            get: function () {
                if (this.value === null || this.value === undefined)
                    return 0;
                var length = this.value.length;
                if (typeof length === "number") {
                    return length;
                }
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
            return Util.map(fn, this.value);
        };
        ObservableValue.prototype.valueOf = function () {
            return this.value;
        };
        return ObservableValue;
    })();
    var Observable = (function () {
        function Observable($id, objects, lib, observer) {
            if (observer === void 0) { observer = null; }
            this.$id = $id;
            this.objects = objects;
            this.lib = lib;
            this.observer = observer;
            this.length = 1;
        }
        Observable.prototype.prop = function (name) {
            for (var i = 0; i < this.objects.length; i++) {
                var object = this.objects[i];
                var value = object[name];
                if (value !== null && value !== undefined) {
                    if (typeof value.apply !== "function") {
                        this.observer.addDependency(Util.id(object), name, value);
                    }
                    return new ObservableValue(value.valueOf(), this.observer);
                }
            }
            return this.lib[name];
        };
        Observable.prototype.itemAt = function () {
            return this;
        };
        Observable.prototype.forEach = function (fn) {
            fn(this, 0);
        };
        Observable.prototype.extend = function (object) {
            if (!object) {
                return this;
            }
            return new Observable(object, [object].concat(this.objects), this.lib);
        };
        Observable.prototype.subscribe = function (observer) {
            if (this.observer === observer)
                return this;
            return new Observable(this.$id, this.objects, this.lib, observer);
        };
        return Observable;
    })();
    var ScopeBinding = (function () {
        function ScopeBinding(scope, observer) {
            this.scope = scope;
            this.observer = observer;
        }
        Object.defineProperty(ScopeBinding.prototype, "context", {
            get: function () {
                return this.scope.context;
            },
            enumerable: true,
            configurable: true
        });
        ScopeBinding.prototype.execute = function (observable, state, additionalArgs) {
            var _this = this;
            var tpl = additionalArgs[0];
            var target = additionalArgs[1];
            var offset = additionalArgs[2];
            var bindings = !!state ? state.bindings : [];
            if (!!tpl.modelAccessor) {
                return Util.ready(tpl.modelAccessor.execute(observable), function (model) {
                    if (model === null || model === undefined)
                        return { bindings: [] };
                    var arr = !!model.forEach ? model : [model];
                    return { bindings: _this.executeArray(observable, arr, offset, tpl, target, bindings) };
                });
            }
            else {
                return { bindings: this.executeArray(observable, observable, offset, tpl, target, bindings) };
            }
        };
        ScopeBinding.prototype.executeArray = function (context, arr, offset, tpl, target, bindings) {
            Binder.removeBindings(target, bindings, arr.length);
            var startInsertAt = offset + bindings.length;
            for (var idx = 0; idx < arr.length; idx++) {
                var result = arr.itemAt(idx);
                if (idx < bindings.length) {
                    bindings[idx].update(result);
                }
                else {
                    var newBinding = tpl.bind(result);
                    var tagSubscription = this.observer.subscribe(newBinding);
                    tagSubscription.notify();
                    newBinding.subscriptions.push(tagSubscription);
                    tpl.children()
                        .reduce(Binder.reduceChild, { context: result, offset: 0, parentBinding: newBinding, binder: this });
                    var insertAt = startInsertAt + idx;
                    if (insertAt < target.childNodes.length) {
                        var beforeElement = target.childNodes[insertAt];
                        target.insertBefore(newBinding.dom, beforeElement);
                    }
                    else {
                        target.appendChild(newBinding.dom);
                    }
                    bindings.push(newBinding);
                }
            }
            return bindings;
        };
        ScopeBinding.prototype.subscribe = function (tpl, target, offset) {
            if (offset === void 0) { offset = 0; }
            var subscription = this.observer.subscribe(this, tpl, target, offset);
            subscription.notify();
            return subscription;
        };
        return ScopeBinding;
    })();
    var Binder = (function () {
        function Binder(viewModel, libs, observer) {
            if (observer === void 0) { observer = new Observer(); }
            this.observer = observer;
            this.context = new Observable(viewModel, [viewModel], libs.reduce(function (x, y) { return Object.assign(x, y); }, {}));
        }
        Object.defineProperty(Binder.prototype, "rootBinding", {
            get: function () {
                return this.rootBinding = new ScopeBinding(this, this.observer);
            },
            enumerable: true,
            configurable: true
        });
        Binder.removeBindings = function (target, bindings, maxLength) {
            while (bindings.length > maxLength) {
                var oldBinding = bindings.pop();
                target.removeChild(oldBinding.dom);
            }
        };
        Binder.reduceChild = function (prev, cur) {
            var parentBinding = prev.parentBinding;
            var binder = prev.binder;
            prev.offset = Util.ready(prev.offset, function (p) {
                var subscr = binder.observer.subscribe(new ScopeBinding(parentBinding, binder.observer), cur, parentBinding.dom, p);
                subscr.notify();
                parentBinding.subscriptions.push(subscr);
                return subscr.then(function (x) { return p + x.bindings.length; });
            });
            return prev;
        };
        Binder.find = function (selector) {
            if (typeof selector === "string")
                return document.querySelector(selector);
            return selector;
        };
        Binder.prototype.subscribe = function (_, tpl, target, offset) {
            if (offset === void 0) { offset = 0; }
            var subscription = this.observer.subscribe(this.rootBinding, tpl, target, offset);
            subscription.notify();
            return subscription;
        };
        return Binder;
    })();
    Xania.Binder = Binder;
})(Xania || (Xania = {}));
