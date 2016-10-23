var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Xania;
(function (Xania) {
    "use strict";
    var Application = (function () {
        function Application(libs) {
            this.libs = libs;
            this.components = new Map();
            this.contexts = [];
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
                        _this.update();
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
                _this.update();
            });
        };
        Application.prototype.update = function () {
            for (var i = 0; i < this.contexts.length; i++) {
                var ctx = this.contexts[i];
                ctx.update(null);
            }
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
        Application.prototype.bind = function (view, viewModel, target) {
            var _this = this;
            var observable = new RootContainer(viewModel, this.libs.reduce(function (x, y) { return Object.assign(x, y); }, {}));
            this.contexts.push(observable);
            Util.ready(this.import(view), function (dom) {
                var tpl = _this.parseDom(dom);
                Binder.executeTemplate(observable, tpl, target, 0);
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
            else {
                var tpl = this.compile(attr.value);
                tagElement.attr(name, tpl || attr.value);
                if (!!tagElement.name.match(/^input$/i) &&
                    !!attr.name.match(/^name$/i) &&
                    !tagElement.getAttribute("value")) {
                    var valueAccessor = this.compile("{{ " + attr.value + " }}");
                    tagElement.attr("value", valueAccessor);
                }
            }
        };
        return Application;
    }());
    var RootContainer = (function () {
        function RootContainer(instance, libs) {
            this.instance = instance;
            this.libs = libs;
            this.properties = [];
        }
        RootContainer.prototype.get = function (name) {
            for (var i = 0; i < this.properties.length; i++) {
                var existing = this.properties[i];
                if (existing.name === name)
                    return existing.value;
            }
            var raw = this.instance[name];
            if (raw !== undefined) {
                var instval = new Immutable(raw);
                this.properties.push({ name: name, value: instval });
                return instval;
            }
            raw = this.libs[name];
            if (raw === undefined)
                throw new Error("Could not resolve " + name);
            var gval = new Global(raw);
            this.properties.push({ name: name, value: gval });
            return gval;
        };
        RootContainer.prototype.subscribe = function (subscr) { throw new Error("Not implemented"); };
        RootContainer.prototype.invoke = function (args) { throw new Error("Not implemented"); };
        RootContainer.prototype.update = function () {
            var stack = [];
            for (var i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                stack.push({ value: property.value, context: null });
            }
            var dirty = new Set();
            while (stack.length > 0) {
                var _a = stack.pop(), value = _a.value, context = _a.context;
                if (value.update(context)) {
                    var subscribers = value.subscribers;
                    var length_1 = subscribers.length;
                    for (var n = 0; n < length_1; n++) {
                        dirty.add(subscribers[n]);
                    }
                    subscribers.length = 0;
                }
                var properties = value.properties;
                var length_2 = properties.length;
                for (var i = 0; i < length_2; i++) {
                    var child = properties[i];
                    stack.push({ value: child, context: value.valueOf() });
                }
            }
            dirty.forEach(function (d) {
                d.notify();
            });
        };
        RootContainer.prototype.forEach = function (fn) {
            fn(this);
        };
        RootContainer.prototype.extend = function (name, value) {
            return new Container(this).add(name, value);
        };
        return RootContainer;
    }());
    var TextTemplate = (function () {
        function TextTemplate(tpl) {
            this.tpl = tpl;
        }
        TextTemplate.prototype.execute = function (context, binding) {
            return this.tpl.execute(context, binding);
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
    }());
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
    }());
    var TagTemplate = (function () {
        function TagTemplate(name) {
            this.name = name;
            this.attributes = [];
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
            var attr = this.getAttribute(name);
            if (!attr)
                this.attributes.push({ name: name.toLowerCase(), tpl: tpl });
            return this;
        };
        TagTemplate.prototype.getAttribute = function (name) {
            var key = name.toLowerCase();
            for (var i = 0; i < this.attributes.length; i++) {
                var attr = this.attributes[i];
                if (attr.name === key)
                    return attr;
            }
            return null;
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
        TagTemplate.prototype.executeAttributes = function (context, binding, resolve) {
            var classes = [];
            var attrs = this.attributes;
            var length = attrs.length;
            for (var i = 0; i < length; i++) {
                var _a = attrs[i], tpl = _a.tpl, name = _a.name;
                var value = tpl.execute(context, binding);
                if (value !== null && value !== undefined && !!value.valueOf)
                    value = value.valueOf();
                if (name === "checked") {
                    resolve(name, !!value ? "checked" : null);
                }
                else if (name === "class") {
                    classes.push(value);
                }
                else if (name.startsWith("class.")) {
                    if (!!value) {
                        var className = name.substr(6);
                        classes.push(className);
                    }
                }
                else {
                    resolve(name, value);
                }
            }
            ;
            resolve("class", classes.length > 0 ? Util.join(" ", classes) : null);
        };
        TagTemplate.prototype.executeEvents = function (context) {
            var result = {}, self = this;
            if (this.name.toUpperCase() === "INPUT") {
                var tpl = this.getAttribute("name").tpl;
                var name = tpl(context);
                result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
            }
            this.events.forEach(function (callback, eventName) {
                result[eventName] = function () { callback.apply(self, [context].concat(arguments)); };
            });
            return result;
        };
        return TagTemplate;
    }());
    var PropertyDependency = (function () {
        function PropertyDependency(object, property, value) {
            this.object = object;
            this.property = property;
            this.value = value;
            if (!!value.id) {
                throw new Error();
            }
        }
        PropertyDependency.prototype.hasChanges = function () {
            var curValue = this.object[this.property];
            return curValue !== this.value;
        };
        PropertyDependency.create = function (object, name, value) {
            if (!!value && !!value.id)
                return new IdentifierDependency(object, name, value.id);
            else
                return new PropertyDependency(object, name, value);
        };
        return PropertyDependency;
    }());
    var IdentifierDependency = (function () {
        function IdentifierDependency(object, property, value) {
            this.object = object;
            this.property = property;
            this.id = value.id;
        }
        IdentifierDependency.prototype.hasChanges = function () {
            var curValue = this.object[this.property];
            return curValue === null || curValue === undefined || curValue.id !== this.id;
        };
        return IdentifierDependency;
    }());
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
        Util.join = function (separator, value) {
            if (Array.isArray(value)) {
                return value.length > 0 ? value.sort().join(separator) : null;
            }
            return value;
        };
        Util.id = function (object) {
            if (object === null || object === undefined)
                return object;
            var id = object['id'];
            if (id === undefined)
                return object;
            return id;
        };
        Util.empty = [];
        return Util;
    }());
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
    }());
    var Binding = (function () {
        function Binding() {
        }
        Binding.prototype.update = function (context) {
            this.context = context;
            var binding = this;
            return Util.ready(binding.state, function (s) {
                return binding.state = binding.execute(s, context);
            });
        };
        Binding.prototype.itemAt = function (arr, idx) {
            return arr.itemAt(idx);
        };
        Binding.prototype.property = function (obj, name) {
            var result = obj.get(name);
            result.subscribe(this);
            return result;
        };
        Binding.prototype.extend = function (context, varName, x) {
            return context.extend(varName, x);
        };
        Binding.prototype.invoke = function (invokable, args) {
            var xs = args.map(function (x) { return x.valueOf(); });
            return invokable.invoke(xs);
        };
        Binding.prototype.notify = function () {
            this.update(this.context);
        };
        return Binding;
    }());
    var ContentBinding = (function (_super) {
        __extends(ContentBinding, _super);
        function ContentBinding(tpl) {
            _super.call(this);
            this.tpl = tpl;
            this.dom = document.createDocumentFragment();
        }
        ContentBinding.prototype.execute = function () {
            return this.dom;
        };
        return ContentBinding;
    }(Binding));
    var TextBinding = (function (_super) {
        __extends(TextBinding, _super);
        function TextBinding(tpl) {
            _super.call(this);
            this.tpl = tpl;
            this.dom = document.createTextNode("");
        }
        TextBinding.prototype.execute = function (state, context) {
            var newValue = this.tpl.execute(context, this).valueOf();
            this.setText(newValue);
        };
        TextBinding.prototype.setText = function (newValue) {
            this.dom.textContent = newValue;
        };
        return TextBinding;
    }(Binding));
    var TagBinding = (function (_super) {
        __extends(TagBinding, _super);
        function TagBinding(tpl) {
            _super.call(this);
            this.tpl = tpl;
            this.attrs = {};
            this.dom = document.createElement(tpl.name);
            this.dom.attributes["__binding"] = this;
        }
        TagBinding.prototype.execute = function (state, context) {
            var tpl = this.tpl;
            var binding = this;
            tpl.executeAttributes(context, this, function executeAttribute(attrName, newValue) {
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
            });
            return this.dom;
        };
        return TagBinding;
    }(Binding));
    var Global = (function () {
        function Global(value) {
            this.value = value;
        }
        Global.prototype.get = function (idx) { throw new Error("Not implemented"); };
        Global.prototype.subscribe = function (subscr) { };
        Global.prototype.invoke = function (args) {
            return this.value.apply(null, args);
        };
        Global.prototype.update = function (context) { };
        return Global;
    }());
    var Immutable = (function () {
        function Immutable(value) {
            this.value = value;
            this.properties = [];
        }
        Immutable.prototype.update = function () {
            return false;
        };
        Immutable.prototype.get = function (name) {
            for (var i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                if (property.name === name)
                    return property;
            }
            var result = new Property(this.value, name);
            this.properties.push(result);
            return result;
        };
        Immutable.prototype.valueOf = function () {
            return this.value;
        };
        Immutable.prototype.subscribe = function (subscr) { return false; };
        Immutable.prototype.hasChanges = function () { return false; };
        Immutable.prototype.invoke = function (args) {
            return null;
        };
        Immutable.prototype.map = function (fn) {
            var result = [];
            for (var i = 0; i < this.value.length; i++) {
                var value = this.get(i);
                result.push(fn(value, i));
            }
            return result;
        };
        return Immutable;
    }());
    var Sequence = (function () {
        function Sequence(arr) {
            this.arr = arr;
            this.subscribers = [];
            this.length = arr.length;
        }
        Sequence.create = function (value) {
            return new Sequence(value);
        };
        Sequence.prototype.get = function (idx) {
            return this.arr[idx];
        };
        Sequence.prototype.subscribe = function (subscr) {
            if (this.subscribers.indexOf(subscr) < 0)
                this.subscribers.push(subscr);
        };
        Sequence.prototype.invoke = function (args) { throw new Error("Not implemented"); };
        Sequence.prototype.update = function () {
            for (var i = 0; i < this.arr.length; i++) {
                this.arr[i].notify();
            }
        };
        Sequence.prototype.hasChanges = function () { return false; };
        Sequence.prototype.forEach = function (fn) {
            for (var i = 0; i < this.arr.length; i++) {
                var item = this.arr[i];
                fn(item);
            }
            return this;
        };
        return Sequence;
    }());
    var Container = (function () {
        function Container(parent) {
            if (parent === void 0) { parent = null; }
            this.parent = parent;
            this.map = {};
        }
        Container.prototype.add = function (name, value) {
            this.map[name] = value;
            return this;
        };
        Container.prototype.extend = function (name, value) {
            return new Container().add(name, value);
        };
        Container.prototype.get = function (name) {
            return this.map[name];
        };
        Container.prototype.forEach = function (fn) {
            fn(this, 0);
        };
        return Container;
    }());
    var Property = (function () {
        function Property(context, name) {
            this.name = name;
            this.subscribers = [];
            this.properties = [];
            this.value = context[name];
        }
        Property.prototype.subscribe = function (subscr) {
            if (this.subscribers.indexOf(subscr) < 0)
                this.subscribers.push(subscr);
        };
        Property.prototype.update = function (context) {
            var currentValue = context[this.name];
            if (this.value !== currentValue) {
                this.value = currentValue;
                return true;
            }
            return false;
        };
        Property.prototype.get = function (name) {
            for (var i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                if (property.name === name)
                    return property;
            }
            var result = new Property(this.value, name);
            this.properties.push(result);
            return result;
        };
        Property.prototype.valueOf = function () {
            return this.value;
        };
        Property.prototype.hasChanges = function () {
            return this.value !== this.valueOf();
        };
        Property.prototype.invoke = function (args) {
            return null;
        };
        Property.prototype.forEach = function (fn) {
            fn(this, 0);
        };
        Property.prototype.map = function (fn) {
            var result = [];
            for (var i = 0; i < this.value.length; i++) {
                var item = this.get(i);
                result.push(fn(item));
            }
            return Sequence.create(result);
        };
        return Property;
    }());
    var ModelAccessorBinding = (function (_super) {
        __extends(ModelAccessorBinding, _super);
        function ModelAccessorBinding(modelAccessor, handler) {
            _super.call(this);
            this.modelAccessor = modelAccessor;
            this.handler = handler;
        }
        ModelAccessorBinding.prototype.execute = function (state, context) {
            return Util.ready(this.modelAccessor.execute(context, this), this.handler);
        };
        return ModelAccessorBinding;
    }(Binding));
    var Binder = (function () {
        function Binder(viewModel, libs) {
            this.context = new RootContainer(viewModel, libs.reduce(function (x, y) { return Object.assign(x, y); }, {}));
        }
        Binder.removeBindings = function (target, bindings, maxLength) {
            while (bindings.length > maxLength) {
                var oldBinding = bindings.pop();
                target.removeChild(oldBinding.dom);
            }
        };
        Binder.reduceChild = function (prev, cur) {
            var parentBinding = prev.parentBinding;
            var context = prev.context;
            prev.offset = Util.ready(prev.offset, function (p) {
                var state = Binder.executeTemplate(context, cur, parentBinding.dom, p);
                return Util.ready(state, function (x) { return p + x.bindings.length; });
            });
            return prev;
        };
        Binder.find = function (selector) {
            if (typeof selector === "string")
                return document.querySelector(selector);
            return selector;
        };
        Binder.executeTemplate = function (observable, tpl, target, offset, state) {
            if (!!tpl.modelAccessor) {
                var binding = new ModelAccessorBinding(tpl.modelAccessor, function (model) {
                    return {
                        bindings: Binder.executeArray(model, offset, tpl, target, state)
                    };
                });
                return binding.update(observable);
            }
            else {
                return {
                    bindings: Binder.executeArray(observable, offset, tpl, target, state)
                };
            }
        };
        Binder.executeArray = function (arr, offset, tpl, target, state) {
            var bindings = !!state ? state.bindings : [];
            Binder.removeBindings(target, bindings, arr.length);
            var startInsertAt = offset + bindings.length;
            arr.forEach(function (result, idx) {
                if (idx < bindings.length) {
                }
                else {
                    var newBinding = tpl.bind();
                    tpl.children()
                        .reduce(Binder.reduceChild, { context: result, offset: 0, parentBinding: newBinding });
                    newBinding.update(result);
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
            });
            return bindings;
        };
        return Binder;
    }());
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