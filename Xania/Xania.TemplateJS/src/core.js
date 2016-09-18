var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../scripts/typings/es6-shim/es6-shim.d.ts" />
var Xania;
(function (Xania) {
    var Application = (function () {
        function Application(libs) {
            this.libs = libs;
            this.components = new Map();
            this.observer = new Observer();
            this.compiler = new Xania.Ast.Compiler();
            this.compile = this.compiler.template.bind(this.compiler);
        }
        Application.prototype.component = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length === 1 && typeof args[0] === "function") {
                var component = args[0];
                if (this.register(component, null)) {
                    return function (component) {
                        _this.unregister(component);
                        _this.register(component, args);
                    };
                }
            }
            return function (component) {
                _this.register(component, args);
            };
        };
        Application.prototype.unregister = function (componentType) {
            var key = componentType.name.toLowerCase();
            var decl = componentType.get(key);
            if (decl.Type === componentType)
                this.components.delete(key);
        };
        Application.prototype.register = function (componentType, args) {
            var key = componentType.name.toLowerCase();
            if (this.components.has(key))
                return false;
            this.components.set(key, { Type: componentType, Args: args });
            return true;
        };
        Application.prototype.start = function (root) {
            if (root === void 0) { root = document.body; }
            var stack = [root];
            while (stack.length > 0) {
                var dom = stack.pop();
                var component = this.getComponent(dom);
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
            this.listen(root);
            return this;
        };
        Application.prototype.listen = function (target) {
            var _this = this;
            var eventHandler = function (target, name) {
                var binding = target.attributes["__binding"];
                if (!!binding) {
                    var handler = binding.tpl.events.get(name);
                    if (!!handler) {
                        var observable = binding.context.valueOf();
                        Util.execute(handler, observable);
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
                        binding.context.set(nameAttr.value, evt.target.value);
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
        Application.prototype.getComponent = function (node) {
            var name = node.nodeName.replace(/\-/, "").toLowerCase();
            if (!this.components.has(name)) {
                return false;
            }
            var decl = this.components.get(name);
            var comp = !!decl.Args
                ? Reflect.construct(decl.Type, decl.Args)
                : new decl.Type;
            for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes.item(i);
                comp[attr.name] = eval(attr.value);
            }
            return comp;
        };
        Application.prototype.import = function (view) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (typeof view === "string") {
                if (!("import" in document.createElement("link"))) {
                    throw new Error("HTML import is not supported in this browser");
                }
                return {
                    then: function (resolve) {
                        var _this = this;
                        var link = document.createElement('link');
                        link.rel = 'import';
                        link.href = view;
                        link.setAttribute('async', "");
                        link.onload = function (e) {
                            var link = e.target;
                            var dom = link.import.querySelector("template");
                            resolve.apply(_this, [dom].concat(args));
                        };
                        document.head.appendChild(link);
                    }
                };
            }
            else if (view instanceof HTMLElement) {
                return view;
            }
            else {
                throw new Error("view type is not supported");
            }
        };
        Application.prototype.bind = function (view, component, target) {
            var _this = this;
            var binder = new Binder(component, this.libs, this.observer);
            Util.ready(this.import(view), function (dom) {
                var tpl = _this.parseDom(dom);
                binder.subscribe(tpl, target);
            });
            return this;
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
                tagElement.attr(name, function (ctx) {
                    var result = Util.execute(fn, ctx);
                    return !!result ? "checked" : null;
                });
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
                var value = Util.execute(tpl, context);
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
            if (classes.length > 0) {
                resolve("class", Util.join(" ", classes), dom);
            }
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
            if (data !== null && data !== undefined && !!data.then)
                return data.then(resolve);
            if (!!resolve.execute)
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
            return function (input) {
                var result = input;
                for (var i = fns.length - 1; i > -1; i--) {
                    var fn = fns[i];
                    result = Util.execute(fn, result);
                }
                return result;
            };
        };
        Util.execute = function (fn, arg) {
            if (typeof fn.execute === "function")
                return fn.execute(arg);
            else if (typeof fn.call === "function")
                return fn.call(null, arg);
            else if (typeof fn.apply === "function")
                return fn.apply(null, [arg]);
            else
                throw new Error("not a function");
        };
        Util.callable = function (fn) {
            if (fn === null || fn === undefined)
                return false;
            return typeof fn === "function" ||
                typeof fn.execute === "function" ||
                typeof fn.apply === "function" ||
                typeof fn.call === "function";
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
                            return function (item) {
                                for (var i = 0; i < arr.length; i++) {
                                    if (Util.id(item) === Util.id(arr[i]))
                                        return i;
                                }
                                return -1;
                            };
                        case "length":
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
                        case "prop":
                            return function (property) {
                                return Util.observeProperty(object, property, object[property], observer);
                            };
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
                observer.addDependency({ object: Util.id(object), property: prop, value: value });
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
            if (context === void 0) { context = undefined; }
            this.context = context;
            this.dependencies = [];
            this.state = undefined;
            this.childBindings = [];
        }
        Binding.prototype.subscribe = function (binding) {
            if (this.childBindings.indexOf(binding) < 0) {
                this.childBindings.push(binding);
            }
        };
        Binding.prototype.unsubscribe = function (binding) {
            var idx = this.childBindings.indexOf(binding);
            if (idx >= 0) {
                this.childBindings.splice(idx, 1);
            }
        };
        Binding.prototype.addDependency = function (dependency) {
            this.dependencies.push(dependency);
        };
        Binding.prototype.notify = function (observer) {
            var stack = [this];
            stack[0].observer = observer;
            while (stack.length > 0) {
                var binding = stack.pop();
                if (binding.hasChanges()) {
                    binding.update(binding.observer);
                }
                for (var i = 0; i < binding.childBindings.length; i++) {
                    var child = binding.childBindings[i];
                    child.observer = binding;
                    stack.push(child);
                }
            }
        };
        Binding.prototype.update = function (observer) {
            var binding = this;
            binding.dependencies.length = 0;
            Util.ready(binding.state, function (s) {
                binding.state = binding.execute(s);
                if ((binding.childBindings.length > 0) || (binding.dependencies.length > 0))
                    observer.subscribe(binding);
                else
                    observer.unsubscribe(binding);
            });
        };
        Binding.prototype.hasChanges = function () {
            if (!this.dependencies) {
                return true;
            }
            var deps = this.dependencies;
            for (var i = 0; i < deps.length; i++) {
                var dep = deps[i];
                var value = dep.object[dep.property];
                value = !!value ? value.valueOf() : value;
                if (value !== dep.value)
                    return true;
            }
            return false;
        };
        return Binding;
    })();
    var Observer = (function () {
        function Observer() {
            this.bindings = [];
        }
        Observer.prototype.subscribe = function (binding) {
            if (this.bindings.indexOf(binding) < 0) {
                this.bindings.push(binding);
            }
        };
        Observer.prototype.unsubscribe = function (binding) {
            var idx = this.bindings.indexOf(binding);
            if (idx >= 0) {
                this.bindings.splice(idx, 1);
            }
        };
        Observer.prototype.update = function () {
            if (this.bindings.length != Observer['dummy']) {
                Observer['dummy'] = this.bindings.length;
                console.log(this.bindings.length);
            }
            for (var i = 0; i < this.bindings.length; i++) {
                var binding = this.bindings[i];
                binding.notify(this);
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
        ContentBinding.prototype.execute = function () {
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
        TextBinding.prototype.execute = function () {
            var observable = this.context.subscribe(this);
            var newValue = this.tpl.execute(observable).valueOf();
            this.setText(newValue);
        };
        TextBinding.prototype.setText = function (newValue) {
            this.dom.textContent = newValue;
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
        TagBinding.prototype.execute = function () {
            var tpl = this.tpl;
            var observable = this.context.subscribe(this);
            tpl.executeAttributes(observable, this, TagBinding.executeAttribute);
            return this.dom;
        };
        TagBinding.executeAttribute = function (attrName, newValue, binding) {
            if (binding.attrs[attrName] === newValue)
                return;
            var oldValue = binding.attrs[attrName];
            var dom = binding.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                dom[attrName] = undefined;
                dom.removeAttribute(attrName);
            }
            else {
                if (typeof oldValue === "undefined") {
                    var domAttr = document.createAttribute(attrName);
                    domAttr.value = newValue;
                    dom.setAttributeNode(domAttr);
                }
                else if (attrName === "class") {
                    dom.className = newValue;
                }
                else {
                    dom[attrName] = newValue;
                }
            }
            binding.attrs[attrName] = newValue;
        };
        return TagBinding;
    })(Binding);
    var ObservableFunction = (function () {
        function ObservableFunction(func, context, observer) {
            this.func = func;
            this.context = context;
            this.observer = observer;
        }
        ObservableFunction.prototype.execute = function () {
            var value = this.func.apply(this.context, arguments);
            return Observable.value(this.context, value, this.observer);
        };
        ObservableFunction.prototype.prop = function (name) {
            var value = this.func[name];
            if (!!this.observer)
                this.observer.addDependency({
                    object: this.func,
                    property: name,
                    value: !!value ? value.valueOf() : value
                });
            return Observable.value(this.func, value, this.observer);
        };
        return ObservableFunction;
    })();
    var ObservableArray = (function () {
        function ObservableArray(arr, observer) {
            this.arr = arr;
            this.observer = observer;
            this.$id = Util.id(arr);
        }
        Object.defineProperty(ObservableArray.prototype, "length", {
            get: function () {
                return this.arr.length;
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype.itemAt = function (idx) {
            var item = this.arr[idx];
            if (!!this.observer)
                this.observer.addDependency({
                    object: this.arr,
                    property: idx,
                    value: item.valueOf()
                });
            return Observable.value(this.arr, item, this.observer);
        };
        ObservableArray.prototype.filter = function (fn) {
            var result = [];
            var length = this.arr.length;
            for (var i = 0; i < length; i++) {
                var item = this.arr[i];
                if (!!this.observer)
                    this.observer.addDependency({
                        object: this.arr,
                        property: i,
                        value: item.valueOf()
                    });
                if (!!Util.execute(fn, item))
                    result.push(item);
            }
            return new ObservableArray(result, this.observer);
        };
        ObservableArray.prototype.count = function (fn) {
            var count = 0;
            for (var i = this.arr.length - 1; i >= 0; i--) {
                var item = this.arr[i];
                if (!!this.observer)
                    this.observer.addDependency({
                        object: this.arr,
                        property: i,
                        value: item
                    });
                if (!!Util.execute(fn, item))
                    count++;
            }
            return count;
        };
        return ObservableArray;
    })();
    var ObservableValue = (function () {
        function ObservableValue(value, observer) {
            this.value = value;
            this.observer = observer;
        }
        Object.defineProperty(ObservableValue.prototype, "length", {
            get: function () {
                return 1;
            },
            enumerable: true,
            configurable: true
        });
        ObservableValue.prototype.prop = function (name) {
            var value = this.value[name].valueOf();
            if (!!this.observer)
                this.observer.addDependency({
                    object: this.value,
                    property: name,
                    value: value
                });
            return Observable.value(this.value, value, this.observer);
        };
        ObservableValue.prototype.valueOf = function () {
            return this.value;
        };
        ObservableValue.prototype.scope = function (object, value) {
            return Observable.value(object, value, this.observer);
        };
        ObservableValue.prototype.itemAt = function (idx) {
            return this;
        };
        ObservableValue.prototype.subscribe = function (observer) {
            if (this.observer === observer)
                return this;
            return new ObservableValue(this.value, observer);
        };
        return ObservableValue;
    })();
    var ImmutableValue = (function () {
        function ImmutableValue(value) {
            this.value = value;
        }
        Object.defineProperty(ImmutableValue.prototype, "length", {
            get: function () {
                return 1;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableValue.prototype.prop = function (name) {
            var value = this.value[name];
            if (value === null || value === undefined)
                return value;
            return new ImmutableValue(value);
        };
        ImmutableValue.prototype.valueOf = function () {
            return this.value;
        };
        return ImmutableValue;
    })();
    var ObservableConst = (function () {
        function ObservableConst(value, observer) {
            this.value = value;
            this.observer = observer;
            this.length = 0;
        }
        ObservableConst.prototype.valueOf = function () {
            return this.value;
        };
        return ObservableConst;
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
        Observable.prototype.valueOf = function () {
            debugger;
            var obj = {};
            for (var i = 0; i < this.objects.length; i++) {
                Object.assign(obj, this.objects[i]);
            }
            return obj;
        };
        Observable.prototype.prop = function (name) {
            for (var i = 0; i < this.objects.length; i++) {
                var object = this.objects[i];
                var value = object[name];
                if (value !== null && value !== undefined) {
                    if (!!this.observer && typeof value !== "function") {
                        this.observer.addDependency({
                            object: object,
                            property: name,
                            value: value
                        });
                    }
                    return Observable.value(object, value, this.observer);
                }
            }
            return this.lib[name];
        };
        Observable.prototype.set = function (name, value) {
            debugger;
            for (var i = 0; i < this.objects.length; i++) {
                var object = this.objects[i];
                if (object.hasOwnProperty(name)) {
                    object[name] = value;
                    break;
                }
            }
            return value;
        };
        Observable.value = function (object, value, observer) {
            if (value === null || value === undefined || typeof value === "boolean" ||
                typeof value === "number" || typeof value === "string")
                return value;
            else if (typeof value === "function" ||
                typeof value.execute === "function" ||
                typeof value.apply === "function" ||
                typeof value.call === "function") {
                return new ObservableFunction(value, object, observer);
            }
            else if (Array.isArray(value)) {
                return new ObservableArray(value, observer);
            }
            else {
                return new ObservableValue(value, observer);
            }
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
    var ScopeBinding = (function (_super) {
        __extends(ScopeBinding, _super);
        function ScopeBinding(scope, observer, tpl, target, offset) {
            _super.call(this, scope.context);
            this.scope = scope;
            this.observer = observer;
            this.tpl = tpl;
            this.target = target;
            this.offset = offset;
        }
        Object.defineProperty(ScopeBinding.prototype, "context", {
            get: function () {
                return this.scope.context;
            },
            enumerable: true,
            configurable: true
        });
        ScopeBinding.prototype.execute = function (state) {
            var _this = this;
            var observable = this.context.subscribe(this);
            var tpl = this.tpl;
            var target = this.target;
            var offset = this.offset;
            var bindings = !!state ? state.bindings : [];
            if (!!tpl.modelAccessor) {
                return Util.ready(tpl.modelAccessor.execute(observable), function (model) {
                    if (model === null || model === undefined)
                        return { bindings: [] };
                    var arr = !!model.itemAt ? model : [model];
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
                    bindings[idx].update(result, this);
                }
                else {
                    var newBinding = tpl.bind(result);
                    tpl.children()
                        .reduce(Binder.reduceChild, { context: result, offset: 0, parentBinding: newBinding, binder: this });
                    newBinding.update(this);
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
        return ScopeBinding;
    })(Binding);
    var Binder = (function () {
        function Binder(viewModel, libs, observer) {
            if (observer === void 0) { observer = new Observer(); }
            this.observer = observer;
            this.context = new Observable(viewModel, [viewModel], libs.reduce(function (x, y) { return Object.assign(x, y); }, {}));
        }
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
                var binding = new ScopeBinding(parentBinding, parentBinding, cur, parentBinding.dom, p);
                binding.update(parentBinding);
                return Util.ready(binding.state, function (x) { return p + x.bindings.length; });
            });
            return prev;
        };
        Binder.find = function (selector) {
            if (typeof selector === "string")
                return document.querySelector(selector);
            return selector;
        };
        Binder.prototype.subscribe = function (tpl, target, offset) {
            if (offset === void 0) { offset = 0; }
            var rootBinding = new ScopeBinding(this, this.observer, tpl, target, offset);
            rootBinding.update(this.observer);
            return rootBinding;
        };
        return Binder;
    })();
    Xania.Binder = Binder;
    function app() {
        var libs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            libs[_i - 0] = arguments[_i];
        }
        return new Application(libs);
    }
    Xania.app = app;
    ;
})(Xania || (Xania = {}));
//# sourceMappingURL=core.js.map