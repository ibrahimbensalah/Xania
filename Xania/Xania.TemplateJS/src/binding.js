var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Xania;
(function (Xania) {
    var Bind;
    (function (Bind) {
        var RootContainer = (function () {
            function RootContainer(value, libs) {
                this.value = value;
                this.libs = libs;
                this.properties = [];
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
            };
            RootContainer.prototype.subscribe = function (subscr) { throw new Error("Not implemented"); };
            RootContainer.prototype.invoke = function (args) { throw new Error("Not implemented"); };
            RootContainer.prototype.update = function () {
                var length, stack = [];
                for (var i = 0; i < this.properties.length; i++) {
                    var property = this.properties[i];
                    stack[i] = property.value;
                }
                var dirty = new Set();
                while (stack.length > 0) {
                    var value = stack.pop();
                    if (value.update()) {
                        if (value.value === undefined) {
                            var parentProps = value.parent.properties;
                            parentProps.splice(parentProps.indexOf(value), 1);
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
            return RootContainer;
        }());
        Bind.RootContainer = RootContainer;
        var Binding = (function () {
            function Binding() {
                this.subscriptions = [];
            }
            Binding.prototype.update = function (context) {
                this.context = context;
                var binding = this;
                return ready(binding.state, function (s) {
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
                return new Extension(context, varName, x);
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
            return Binding;
        }());
        var ContentBinding = (function (_super) {
            __extends(ContentBinding, _super);
            function ContentBinding() {
                _super.call(this);
                this.dom = document.createDocumentFragment();
            }
            ContentBinding.prototype.render = function () {
                return this.dom;
            };
            return ContentBinding;
        }(Binding));
        Bind.ContentBinding = ContentBinding;
        var TextBinding = (function (_super) {
            __extends(TextBinding, _super);
            function TextBinding(modelAccessor, context) {
                _super.call(this);
                this.modelAccessor = modelAccessor;
                this.dom = document.createTextNode("");
                this.context = context;
            }
            TextBinding.prototype.render = function (context) {
                var newValue = this.modelAccessor.execute(context, this).valueOf();
                this.setText(newValue);
            };
            TextBinding.prototype.setText = function (newValue) {
                this.dom.textContent = newValue;
            };
            return TextBinding;
        }(Binding));
        Bind.TextBinding = TextBinding;
        var TagBinding = (function (_super) {
            __extends(TagBinding, _super);
            function TagBinding(name, attributes, events) {
                _super.call(this);
                this.attributes = attributes;
                this.events = events;
                this.attrs = {};
                this.dom = document.createElement(name);
                this.dom.attributes["__binding"] = this;
            }
            TagBinding.prototype.render = function (context) {
                var binding = this;
                this.executeAttributes(this.attributes, context, this, function executeAttribute(attrName, newValue) {
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
            TagBinding.prototype.executeAttributes = function (attributes, context, binding, resolve) {
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
                resolve("class", classes.length > 0 ? join(" ", classes) : null);
            };
            TagBinding.prototype.trigger = function (name) {
                var handler = this.events.get(name);
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
        Bind.TagBinding = TagBinding;
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
            Property.prototype.set = function (value) {
                this.parent.value[this.name] = value;
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
        Bind.Property = Property;
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
                if (!!tpl.modelAccessor) {
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
                this.addBinding(this.tpl.bind(result), idx);
            };
            ReactiveBinding.prototype.addBinding = function (newBinding, idx) {
                var _a = this, offset = _a.offset, target = _a.target, bindings = _a.bindings;
                var insertAt = offset + idx;
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
        function executeTemplate(observable, tpl, target, offset) {
            return new ReactiveBinding(tpl, target, offset).update(observable);
        }
        Bind.executeTemplate = executeTemplate;
    })(Bind = Xania.Bind || (Xania.Bind = {}));
    function ready(data, resolve) {
        if (data !== null && data !== undefined && !!data.then)
            return data.then(resolve);
        if (!!resolve.execute)
            return resolve.execute.call(resolve, data);
        return resolve.call(resolve, data);
    }
    Xania.ready = ready;
    function join(separator, value) {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.sort().join(separator) : null;
        }
        return value;
    }
    Xania.join = join;
})(Xania || (Xania = {}));
//# sourceMappingURL=binding.js.map