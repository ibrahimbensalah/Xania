var Xania;
(function (Xania) {
    var Data;
    (function (Data) {
        var Store = (function () {
            function Store(value, libs) {
                this.value = value;
                this.libs = libs;
                this.properties = [];
            }
            Store.prototype.get = function (name) {
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
            Store.prototype.set = function (name, value) {
                this.value[name] = value;
            };
            Store.prototype.subscribe = function (subscr) { throw new Error("Not implemented"); };
            Store.prototype.invoke = function (args) { throw new Error("Not implemented"); };
            Store.prototype.update = function () {
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
            Store.prototype.forEach = function (fn) {
                fn(this, 0);
            };
            return Store;
        }());
        Data.Store = Store;
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
                // this.context = context === undefined ? this.context : context;
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
        Data.Property = Property;
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
        Data.Extension = Extension;
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
        Data.Immutable = Immutable;
        var ObjectContainer = (function () {
            function ObjectContainer() {
                this.components = new Map();
            }
            ObjectContainer.prototype.get = function (name) {
                var comp;
                if (this.components.has(name)) {
                    var decl = this.components.get(name);
                    comp = !!decl.Args
                        ? Reflect.construct(decl.Type, decl.Args)
                        : new decl.Type;
                }
                else {
                    comp = this.global(name);
                }
                if (!comp)
                    return false;
                return comp;
            };
            ObjectContainer.prototype.global = function (name) {
                // ReSharper disable once MissingHasOwnPropertyInForeach
                for (var k in window) {
                    if (name.toLowerCase() === k.toLowerCase()) {
                        var v = window[k];
                        if (typeof v === "function")
                            // ReSharper disable once InconsistentNaming
                            return new v();
                    }
                }
                return null;
            };
            ObjectContainer.prototype.component = function () {
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
            ObjectContainer.prototype.unregister = function (componentType) {
                var key = componentType.name.toLowerCase();
                var decl = componentType.get(key);
                if (decl.Type === componentType)
                    this.components.delete(key);
            };
            ObjectContainer.prototype.register = function (componentType, args) {
                var key = componentType.name.toLowerCase();
                if (this.components.has(key))
                    return false;
                this.components.set(key, { Type: componentType, Args: args });
                return true;
            };
            return ObjectContainer;
        }());
        Data.ObjectContainer = ObjectContainer;
    })(Data = Xania.Data || (Xania.Data = {}));
})(Xania || (Xania = {}));
