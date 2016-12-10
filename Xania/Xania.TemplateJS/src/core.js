var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Xania;
(function (Xania) {
    var RootContainer = (function () {
        function RootContainer(value, libs) {
            this.value = value;
            this.libs = libs;
            this.properties = [];
            this.extensions = [];
        }
        RootContainer.prototype.get = function (name) {
            for (var i = 0; i < this.properties.length; i++) {
                var existing = this.properties[i];
                if (existing.name === name)
                    return existing.value;
            }
            var raw = this.value[name];
            if (raw !== undefined) {
                var instval = new Property(this, name);
                this.properties.push({ name: name, value: instval });
                return instval;
            }
            raw = this.value.constructor[name] || this.libs[name];
            if (raw === undefined)
                throw new Error("Could not resolve " + name);
            var gv = new Global(raw);
            this.properties.push({ name: name, value: gv });
            return gv;
        };
        RootContainer.prototype.set = function (name, value) {
            this.value[name] = value;
            this.update();
        };
        RootContainer.prototype.subscribe = function (subscr) { throw new Error("Not implemented"); };
        RootContainer.prototype.invoke = function (args) { throw new Error("Not implemented"); };
        RootContainer.prototype.update = function () {
            for (var i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                RootContainer.updateValue(property.value, this.value);
            }
        };
        RootContainer.updateValue = function (rootValue, rootContext) {
            var length, stack = [rootValue];
            var dirty = new Set();
            while (stack.length > 0) {
                var value = stack.pop();
                if (value.update()) {
                    if (value.value === undefined) {
                        var parent = value.parent;
                        parent.properties.splice(parent.properties.indexOf(value), 1);
                        continue;
                    }
                    var subscribers = value.subscribers;
                    for (var n = 0; n < subscribers.length; n++) {
                        var s = subscribers[n];
                        dirty.add(s);
                    }
                    subscribers.length = 0;
                }
                var properties = value.properties;
                length = properties.length;
                for (var i = 0; i < length; i++) {
                    var child = properties[i];
                    stack.push(child);
                }
            }
            dirty.forEach(function (d) {
                d.notify();
            });
        };
        RootContainer.prototype.forEach = function (fn) {
            fn(this, 0);
        };
        RootContainer.prototype.extend2 = function (name, value) {
            for (var i = 0; i < this.extensions.length; i++) {
                var ext = this.extensions[i];
                if (ext.name === name && ext.id === value.id)
                    return ext.container;
            }
            var container = new Extension(this, name, value);
            return container;
        };
        return RootContainer;
    }());
    Xania.RootContainer = RootContainer;
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
    Xania.TextTemplate = TextTemplate;
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
    Xania.ContentTemplate = ContentTemplate;
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
        TagTemplate.prototype.getEvent = function (name) {
            return this.events.get(name);
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
    Xania.TagTemplate = TagTemplate;
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
    Xania.Util = Util;
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
            this.subscriptions = [];
        }
        Binding.prototype.update = function (context) {
            this.context = context;
            var binding = this;
            return Util.ready(binding.state, function (s) {
                return binding.state = binding.render(context, s);
            });
        };
        Binding.prototype.get = function (obj, name) {
            var result = obj.get(name);
            if (!!result && !!result.subscribe) {
                var subscription = result.subscribe(this);
                this.subscriptions.push(subscription);
            }
            return result;
        };
        Binding.prototype.extend = function (context, varName, x) {
            return context.extend2(varName, x);
        };
        Binding.prototype.invoke = function (root, invocable, args) {
            var runtime = {
                binding: this,
                get: function (target, name) {
                    var result = target.get(name);
                    if (!!result && !!result.subscribe)
                        result.subscribe(this.binding);
                    var value = result.valueOf();
                    var type = typeof value;
                    if (value === null ||
                        type === "function" ||
                        type === "undefined" ||
                        type === "boolean" ||
                        type === "number" ||
                        type === "string")
                        return value;
                    return result;
                },
                set: function (target, name, value) {
                    target.set(name, value);
                }
            };
            var zone = new Xania.Zone(runtime);
            var arr = args.map(function (result) {
                var type = typeof result.value;
                if (result.value === null ||
                    type === "function" ||
                    type === "boolean" ||
                    type === "number" ||
                    type === "string")
                    return result.value;
                return result;
            });
            var result = zone.run(invocable, null, arr);
            if (!!result && result.subscribe) {
                return result;
            }
            return new Immutable(result);
        };
        Binding.prototype.forEach = function (context, fn) {
            return context.forEach(fn);
        };
        Binding.prototype.notify = function () {
            this.update(this.context);
        };
        Binding.prototype.trigger = function (name) {
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
        ContentBinding.prototype.render = function () {
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
        TextBinding.prototype.render = function (context) {
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
        TagBinding.prototype.render = function (context) {
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
        TagBinding.prototype.trigger = function (name) {
            var handler = this.tpl.getEvent(name);
            if (!!handler) {
                var result = handler.execute(this.context, {
                    get: function (value, name) {
                        return value.get(name);
                    },
                    invoke: function (_, fn, args) {
                        var xs = args.map(function (x) { return x.valueOf(); });
                        fn.invoke(xs);
                    }
                });
                if (!!result && typeof result.value === "function")
                    result.invoke();
            }
        };
        return TagBinding;
    }(Binding));
    var Global = (function () {
        function Global(value) {
            this.value = value;
            this.properties = [];
        }
        Global.prototype.get = function (name) {
            return this[name];
        };
        Global.prototype.subscribe = function (subscr) { };
        Global.prototype.invoke = function (args) {
            return this.value.apply(null, args);
        };
        Global.prototype.update = function (context) {
            return false;
        };
        Global.prototype.forEach = function (fn) {
            return this.value.forEach(fn);
        };
        return Global;
    }());
    var Immutable = (function () {
        function Immutable(value) {
            this.value = value;
            this.properties = [];
            if (!!value.$target)
                throw new Error("proxy is not allowed");
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
            var value = this.value[name];
            var result = (value instanceof Property) ? value : new Property(this, name);
            this.properties.push(result);
            return result;
        };
        Immutable.prototype.valueOf = function () {
            return this.value;
        };
        Immutable.prototype.subscribe = function (subscr) { return false; };
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
        Immutable.prototype.forEach = function (fn) {
            for (var i = 0; i < this.value.length; i++) {
                var value = this.get(i);
                fn(value, i);
            }
        };
        return Immutable;
    }());
    var Extension = (function () {
        function Extension(parent, name, value) {
            this.parent = parent;
            this.name = name;
            this.value = value;
        }
        Extension.prototype.extend2 = function (name, value) {
            var container = new Extension(this, name, value);
            return container;
        };
        Extension.prototype.get = function (name) {
            if (name === this.name)
                return this.value;
            if (this.parent !== null)
                return this.parent.get(name);
            return undefined;
        };
        Extension.prototype.forEach = function (fn) {
            fn(this, 0);
        };
        Extension.prototype.update = function () {
            var value = this.value;
            RootContainer.updateValue(value, value.context);
        };
        return Extension;
    }());
    var Property = (function () {
        function Property(parent, name) {
            this.parent = parent;
            this.name = name;
            this.subscribers = [];
            this.properties = [];
            var value = parent.value[name];
            this.value = value;
            this.id = value;
            if (!!this.value && this.value.id !== undefined)
                this.id = this.value.id;
        }
        Property.prototype.subscribe = function (subscr) {
            if (this.subscribers.indexOf(subscr) < 0)
                this.subscribers.push(subscr);
        };
        Property.prototype.update = function () {
            var currentValue = this.parent.value[this.name];
            if (currentValue === undefined)
                return true;
            var currentId = currentValue;
            if (!!currentValue && currentValue.id !== undefined)
                currentId = currentValue.id;
            if (this.id !== currentId) {
                this.value = currentValue;
                this.id = currentId;
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
            var result = new Property(this, name);
            this.properties.push(result);
            return result;
        };
        Property.prototype.set = function (name, value) {
            this.value[name] = value;
        };
        Property.prototype.valueOf = function () {
            return this.value;
        };
        Property.prototype.hasChanges = function () {
            return this.value !== this.valueOf();
        };
        Property.prototype.invoke = function (args) {
            var value = this.value;
            if (value === void 0 || value === null)
                throw new TypeError(this.name + " is not invocable");
            if (!!value.execute)
                return value.execute.apply(value, args);
            return value.apply(this.parent.value, args);
        };
        Property.prototype.forEach = function (fn) {
            for (var i = 0; i < this.value.length; i++) {
                var value = this.get(i);
                fn(value, i);
            }
        };
        return Property;
    }());
    Xania.Property = Property;
    var ReactiveBinding = (function (_super) {
        __extends(ReactiveBinding, _super);
        function ReactiveBinding(tpl, target, offset) {
            _super.call(this);
            this.tpl = tpl;
            this.target = target;
            this.offset = offset;
            this.bindings = [];
        }
        ReactiveBinding.prototype.render = function (context) {
            var _this = this;
            var _a = this, bindings = _a.bindings, target = _a.target, tpl = _a.tpl;
            if (!!this.tpl.modelAccessor) {
                var stream = tpl.modelAccessor.execute(context, this);
                this.length = 0;
                stream.forEach(function (ctx, idx) {
                    _this.length = idx + 1;
                    for (var i = 0; i < bindings.length; i++) {
                        var binding = bindings[i];
                        if (binding.context.value === ctx.value) {
                            if (i !== idx) {
                                bindings[i] = bindings[idx];
                                bindings[idx] = binding;
                            }
                            return;
                        }
                    }
                    _this.execute(ctx, idx);
                });
            }
            else {
                this.execute(context, 0);
                this.length = 1;
            }
            while (bindings.length > this.length) {
                var oldBinding = bindings.pop();
                target.removeChild(oldBinding.dom);
            }
            return this;
        };
        ReactiveBinding.prototype.execute = function (result, idx) {
            var _a = this, offset = _a.offset, tpl = _a.tpl, target = _a.target, bindings = _a.bindings;
            var insertAt = offset + idx;
            var newBinding = tpl.bind();
            tpl.children()
                .reduce(Binder.reduceChild, { context: result, offset: 0, parentBinding: newBinding });
            newBinding.update(result);
            if (insertAt < target.childNodes.length) {
                var beforeElement = target.childNodes[insertAt];
                target.insertBefore(newBinding.dom, beforeElement);
            }
            else {
                target.appendChild(newBinding.dom);
            }
            bindings.splice(idx, 0, newBinding);
        };
        return ReactiveBinding;
    }(Binding));
    var Binder = (function () {
        function Binder() {
        }
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
        Binder.executeTemplate = function (observable, tpl, target, offset) {
            var binding = new ReactiveBinding(tpl, target, offset);
            return binding.update(observable);
        };
        return Binder;
    }());
    Xania.Binder = Binder;
})(Xania || (Xania = {}));
//# sourceMappingURL=core.js.map