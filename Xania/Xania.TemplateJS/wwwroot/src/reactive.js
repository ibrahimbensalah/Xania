"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require("./core");
var Reactive;
(function (Reactive) {
    var Value = (function () {
        function Value() {
        }
        Value.prototype.get = function (propertyName) {
            var properties = this.properties;
            if (this.properties) {
                var length = properties.length;
                for (var i = 0; i < length; i++) {
                    if (properties[i].name === propertyName) {
                        return properties[i];
                    }
                }
            }
            var propertyValue = this.value, initialValue = propertyValue[propertyName];
            if (initialValue === void 0)
                return void 0;
            if (typeof initialValue === "function") {
                return initialValue.bind(propertyValue);
            }
            var property = new Property(this, propertyName);
            property[propertyName] = initialValue;
            property.value = initialValue;
            if (!properties)
                this.properties = [property];
            else
                properties.push(property);
            this[propertyName] = property;
            return property;
        };
        return Value;
    }());
    var Property = (function (_super) {
        __extends(Property, _super);
        function Property(parent, name) {
            var _this = _super.call(this) || this;
            _this.parent = parent;
            _this.name = name;
            return _this;
        }
        Property.prototype.get = function (name) {
            var result = _super.prototype.get.call(this, name);
            if (result !== void 0) {
                this[name] = result;
                return result;
            }
            return this.parent.get(name);
        };
        Property.prototype.change = function (action) {
            if (!this.actions) {
                this.actions = [action];
                return this;
            }
            else if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        };
        Property.prototype.unbind = function (action) {
            var actions = this.actions;
            if (!actions)
                return false;
            var idx = actions.indexOf(action);
            if (idx < 0)
                return false;
            actions.splice(idx, 1);
            return true;
        };
        Property.prototype.set = function (value) {
            this.parent.value[this.name] = value;
        };
        Property.prototype.refresh = function (parentValue) {
            var name = this.name, newValue = parentValue[name];
            if (newValue !== this.value) {
                this[name] = newValue;
                this.value = newValue;
                if (this.awaited) {
                    this.awaited.dispose();
                    delete this.awaited;
                }
                return true;
            }
            return false;
        };
        Property.prototype.valueOf = function () {
            return this.value;
        };
        Property.prototype.await = function () {
            if (!this.awaited) {
                this.awaited = new Awaited(this.value);
            }
            return this.awaited;
        };
        return Property;
    }(Value));
    var Awaited = (function () {
        function Awaited(observable) {
            this.subscription = observable.subscribe(this);
            this.current = observable.current;
        }
        Awaited.prototype.onNext = function (newValue) {
            if (this.current !== newValue) {
                this.current = newValue;
                if (this.actions) {
                    var actions = this.actions.slice(0);
                    for (var i = 0; i < actions.length; i++) {
                        actions[i].execute();
                    }
                }
            }
        };
        Awaited.prototype.change = function (action) {
            if (!this.actions) {
                this.actions = [action];
                return this;
            }
            else if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        };
        Awaited.prototype.unbind = function (action) {
            if (!this.actions)
                return false;
            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;
            this.actions.splice(idx, 1);
            return true;
        };
        Awaited.prototype.dispose = function () {
            this.subscription.dispose();
        };
        Awaited.prototype.valueOf = function () {
            return this.current;
        };
        return Awaited;
    }());
    Reactive.Awaited = Awaited;
    var Extension = (function () {
        function Extension(parent) {
            this.parent = parent;
        }
        Extension.prototype.add = function (name, value) {
            this[name] = value;
            return this;
        };
        Extension.prototype.get = function (name) {
            var value = this[name];
            if (value === null)
                return null;
            if (value === void 0) {
                if (this.parent)
                    return this.parent.get(name);
                return value;
            }
            if (value.valueOf() === void 0)
                return void 0;
            return value;
        };
        Extension.prototype.refresh = function () {
            this.parent.refresh();
        };
        return Extension;
    }());
    Reactive.Extension = Extension;
    var Store = (function (_super) {
        __extends(Store, _super);
        function Store(value, globals) {
            if (globals === void 0) { globals = {}; }
            var _this = _super.call(this) || this;
            _this.globals = globals;
            _this.value = value;
            return _this;
        }
        Store.prototype.get = function (name) {
            var value = _super.prototype.get.call(this, name);
            if (value !== void 0) {
                return value;
            }
            var statiq = this.value.constructor && this.value.constructor[name];
            if (typeof statiq === "function")
                return statiq.bind(this.value.constructor);
            if (statiq !== void 0) {
                return statiq;
            }
            for (var i = 0; i < this.globals.length; i++) {
                var g = this.globals[i][name];
                if (g !== void 0)
                    return g;
            }
            return void 0;
        };
        Store.prototype.refresh = function () {
            var stack = [this];
            var dirty = [];
            while (stack.length > 0) {
                var parent_1 = stack.pop();
                var parentValue = parent_1.value;
                if (parent_1.properties) {
                    var properties = parent_1.properties;
                    var i = properties.length;
                    while (i--) {
                        var child = properties[i];
                        var changed = child.refresh(parentValue);
                        if (child.value === void 0) {
                            properties.splice(i, 1);
                            delete parent_1[child.name];
                        }
                        else {
                            stack.push(child);
                            if (changed === true) {
                                var actions = child.actions;
                                if (actions) {
                                    var e = actions.length;
                                    while (e--) {
                                        dirty.push(actions[e]);
                                    }
                                }
                            }
                        }
                    }
                    ;
                }
            }
            var j = dirty.length;
            while (j--) {
                dirty[j].execute();
            }
        };
        Store.prototype.toString = function () {
            return JSON.stringify(this.value, null, 4);
        };
        return Store;
    }(Value));
    Reactive.Store = Store;
    var DefaultDispatcher = (function () {
        function DefaultDispatcher() {
        }
        DefaultDispatcher.dispatch = function (action) {
            action.execute();
        };
        return DefaultDispatcher;
    }());
    var Binding = (function () {
        function Binding(dispatcher) {
            if (dispatcher === void 0) { dispatcher = DefaultDispatcher; }
            this.dispatcher = dispatcher;
        }
        Binding.prototype.execute = function () {
            this.render(this.context, this.sinks);
        };
        Binding.prototype.update = function (context, sinks) {
            if (this.context !== context || this.sinks !== sinks) {
                this.context = context;
                this.sinks = sinks;
                this.render(context, sinks);
            }
            return this;
        };
        Binding.prototype.dispose = function () {
            if (this.context) {
                var stack = [this.context];
                while (stack.length > 0) {
                    var value = stack.pop();
                    if (value.unbind) {
                        value.unbind(this);
                    }
                    var properties = value.properties;
                    if (properties) {
                        var i = properties.length - 1;
                        do {
                            stack.push(properties[i]);
                        } while (i--);
                    }
                }
            }
        };
        Binding.prototype.observe = function (value) {
            if (value && value.change) {
                value.change(this);
            }
        };
        Binding.prototype.extend = function (name, value) {
            for (var i = 0; this.extensions && i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.name === value) {
                    return x.value.add(name, value);
                }
            }
            var scope = new Extension(this.context).add(name, value);
            if (!this.extensions)
                this.extensions = [];
            this.extensions.push({ name: value, value: scope });
            return scope;
        };
        Binding.prototype.where = function (source, predicate) {
            throw new Error("Not implemented");
        };
        Binding.prototype.select = function (source, selector) {
            return source.map(selector);
        };
        Binding.prototype.query = function (param, source) {
            var _this = this;
            this.observe(source);
            if (source.get) {
                var length = source.get("length");
                this.observe(length);
                var result = [];
                var len = length.valueOf();
                for (var i = 0; i < len; i++) {
                    var ext = this.extend(param, source.get(i));
                    result.push(ext);
                }
                return result;
            }
            else {
                return source.map(function (item) {
                    return _this.extend(param, item);
                });
            }
        };
        Binding.prototype.member = function (target, name) {
            var value = target[name];
            if (value === undefined && target.get)
                value = target.get(name);
            this.observe(value);
            return value;
        };
        Binding.prototype.app = function (fun, args) {
            var xs = [], length = args.length;
            for (var i = 0; i < length; i++) {
                var arg = args[i];
                if (arg && arg.valueOf) {
                    var x = arg.valueOf();
                    if (x === void 0)
                        return void 0;
                    xs.push(x);
                }
                else {
                    xs.push(arg);
                }
            }
            if (fun === "+") {
                return xs[1] + xs[0];
            }
            else if (fun === "-") {
                return xs[1] - xs[0];
            }
            else if (fun === "*") {
                return xs[1] * xs[0];
            }
            else if (fun === "assign") {
                throw new Error("assignment is only allow in EventBinding");
            }
            return fun.apply(null, xs);
        };
        Binding.prototype.const = function (value) {
            return value;
        };
        Binding.prototype.await = function (observable) {
            if (!observable.awaited) {
                observable.awaited = new Awaited(observable.valueOf());
            }
            this.observe(observable.awaited);
            return observable.awaited;
        };
        Binding.prototype.evaluate = function (parts) {
            if (parts.execute)
                return parts.execute(this, this.context);
            else if (Array.isArray(parts)) {
                var result = core_1.Core.empty;
                for (var i = 0; i < parts.length; i++) {
                    var part = this.evaluate(parts[i]);
                    if (part !== void 0)
                        result += part;
                }
                return result;
            }
            else
                return parts;
        };
        return Binding;
    }());
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Reactive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQThCO0FBRzlCLElBQWMsUUFBUSxDQXdkckI7QUF4ZEQsV0FBYyxRQUFRO0lBa0JsQjtRQUFBO1FBdUNBLENBQUM7UUFuQ0csbUJBQUcsR0FBSCxVQUFJLFlBQW9CO1lBQ3BCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFFakMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzlCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFDdEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekIsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQzFCLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLElB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O2dCQUNkLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLE1BQU0sR0FBRyxXQUFJLENBQUMsS0FBSyxDQUFDO2dCQUN4QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbkMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO3dCQUNoQixNQUFNLElBQUksSUFBSSxDQUFDO2dCQUN2QixDQUFDO2dCQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUk7Z0JBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNyQixDQUFDO1FBQ0wsY0FBQztJQUFELENBQUMsQUE1SkQsSUE0SkM7SUE1SnFCLGdCQUFPLFVBNEo1QixDQUFBO0FBQ0wsQ0FBQyxFQXhkYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQXdkckI7O0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuL2NvcmVcIjtcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tICcuL29ic2VydmFibGVzJ1xyXG5cclxuZXhwb3J0IG1vZHVsZSBSZWFjdGl2ZSB7XHJcblxyXG4gICAgaW50ZXJmYWNlIElFeHByZXNzaW9uUGFyc2VyIHtcclxuICAgICAgICBwYXJzZShleHByOiBzdHJpbmcpOiB7IGV4ZWN1dGUoc2NvcGU6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSkgfTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElBY3Rpb24ge1xyXG4gICAgICAgIGV4ZWN1dGUoKTtcclxuICAgICAgICBub3RpZnkodmFsdWU6IElEZXBlbmRlbmN5KTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVByb3BlcnR5IHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmFsdWU6IGFueTtcclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKTtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHVibGljIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdO1xyXG4gICAgICAgIHB1YmxpYyB2YWx1ZTtcclxuXHJcbiAgICAgICAgZ2V0KHByb3BlcnR5TmFtZTogc3RyaW5nKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbaV0ubmFtZSA9PT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gcHJvcGVydHlWYWx1ZVtwcm9wZXJ0eU5hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbFZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbml0aWFsVmFsdWUuYmluZChwcm9wZXJ0eVZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KHRoaXMsIHByb3BlcnR5TmFtZSk7XHJcbiAgICAgICAgICAgIHByb3BlcnR5W3Byb3BlcnR5TmFtZV0gPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlID0gaW5pdGlhbFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gW3Byb3BlcnR5XTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURlcGVuZGVuY3kge1xyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pOiBudW1iZXIgfCBib29sZWFuO1xyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFByb3BlcnR5IGV4dGVuZHMgVmFsdWUgaW1wbGVtZW50cyBJRGVwZW5kZW5jeSB7XHJcbiAgICAgICAgLy8gbGlzdCBvZiBvYnNlcnZlcnMgdG8gYmUgZGlzcGF0Y2hlZCBvbiB2YWx1ZSBjaGFuZ2VcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFZhbHVlLCBwdWJsaWMgbmFtZSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbbmFtZV0gPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hhbmdlKGFjdGlvbjogSUFjdGlvbik6IHRoaXMgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zO1xyXG4gICAgICAgICAgICBpZiAoIWFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpZHggPSBhY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBhY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldCh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnZhbHVlW3RoaXMubmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlZnJlc2gocGFyZW50VmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHBhcmVudFZhbHVlW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB0aGlzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW25hbWVdID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXdhaXRlZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYXdhaXRlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGF3YWl0ZWQ6IEF3YWl0ZWQ7XHJcbiAgICAgICAgYXdhaXQoKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF3YWl0ZWQgPSBuZXcgQXdhaXRlZCh0aGlzLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hd2FpdGVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXdhaXRlZCB7XHJcbiAgICAgICAgcHJpdmF0ZSBzdWJzY3JpcHRpb247XHJcbiAgICAgICAgcHJpdmF0ZSBhY3Rpb25zOiBJQWN0aW9uW107XHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihvYnNlcnZhYmxlOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24gPSBvYnNlcnZhYmxlLnN1YnNjcmliZSh0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gb2JzZXJ2YWJsZS5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnQgIT09IG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zLnNsaWNlKDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25zW2ldLmV4ZWN1dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb246IElBY3Rpb24pOiBJRGVwZW5kZW5jeSB8IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zID0gW2FjdGlvbl07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV4dGVuc2lvbiB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50PzogeyBnZXQobmFtZTogc3RyaW5nKTsgcmVmcmVzaCgpOyB9KSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGQobmFtZTogc3RyaW5nLCB2YWx1ZTogVmFsdWUpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpc1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlT2YoKSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlZnJlc2goKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnJlZnJlc2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3RvcmUgZXh0ZW5kcyBWYWx1ZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IodmFsdWU6IGFueSwgcHJpdmF0ZSBnbG9iYWxzOiBhbnkgPSB7fSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1cGVyLmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzdGF0aXEgPSB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yICYmIHRoaXMudmFsdWUuY29uc3RydWN0b3JbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGlxID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxLmJpbmQodGhpcy52YWx1ZS5jb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGlxICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5nbG9iYWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZyA9IHRoaXMuZ2xvYmFsc1tpXVtuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChnICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWZyZXNoKCkge1xyXG4gICAgICAgICAgICB2YXIgc3RhY2s6IHsgcHJvcGVydGllcywgdmFsdWUgfVtdID0gW3RoaXNdO1xyXG4gICAgICAgICAgICB2YXIgZGlydHkgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudFZhbHVlID0gcGFyZW50LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBwYXJlbnQucHJvcGVydGllcztcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaTogbnVtYmVyID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGFuZ2VkID0gY2hpbGQucmVmcmVzaChwYXJlbnRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC52YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJlbnRbY2hpbGQubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGNoaWxkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBjaGlsZC5hY3Rpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlID0gYWN0aW9ucy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKGUtLSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJ0eS5wdXNoKGFjdGlvbnNbZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGogPSBkaXJ0eS5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlKGotLSkge1xyXG4gICAgICAgICAgICAgICAgZGlydHlbal0uZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUsIG51bGwsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBEZWZhdWx0RGlzcGF0Y2hlciB7XHJcbiAgICAgICAgc3RhdGljIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24uZXhlY3V0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZGluZyB7XHJcbiAgICAgICAgcHJvdGVjdGVkIGNvbnRleHQ7XHJcbiAgICAgICAgcHJvdGVjdGVkIHNpbmtzO1xyXG4gICAgICAgIHByb3RlY3RlZCBleHRlbnNpb25zOiB7IG5hbWU6IGFueSwgdmFsdWU6IEV4dGVuc2lvbiB9W107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkaXNwYXRjaGVyOiB7IGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbikgfSA9IERlZmF1bHREaXNwYXRjaGVyKSB7IH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jb250ZXh0LCB0aGlzLnNpbmtzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0LCBzaW5rcyk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb250ZXh0ICE9PSBjb250ZXh0IHx8IHRoaXMuc2lua3MgIT09IHNpbmtzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaW5rcyA9IHNpbmtzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoY29udGV4dCwgc2lua3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrID0gW3RoaXMuY29udGV4dF07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS51bmJpbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUudW5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHZhbHVlLnByb3BlcnRpZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwcm9wZXJ0aWVzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gocHJvcGVydGllc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGktLSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvYnNlcnZlKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLmNoYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFic3RyYWN0IHJlbmRlcihjb250ZXh0LCBwYXJlbnQpOiBhbnk7XHJcblxyXG4gICAgICAgIGV4dGVuZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IHRoaXMuZXh0ZW5zaW9ucyAmJiBpIDwgdGhpcy5leHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZXh0ZW5zaW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICh4Lm5hbWUgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWUuYWRkKG5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNjb3BlID0gbmV3IEV4dGVuc2lvbih0aGlzLmNvbnRleHQpLmFkZChuYW1lLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZXh0ZW5zaW9ucylcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goeyBuYW1lOiB2YWx1ZSwgdmFsdWU6IHNjb3BlIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcXVlcnkocGFyYW0sIHNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aGlzLm9ic2VydmUoc291cmNlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UuZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gc291cmNlLmdldChcImxlbmd0aFwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShsZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IGxlbmd0aC52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4dCA9IHRoaXMuZXh0ZW5kKHBhcmFtLCBzb3VyY2UuZ2V0KGkpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4dGVuZChwYXJhbSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWVtYmVyKHRhcmdldDogeyBnZXQobmFtZTogc3RyaW5nKSB9LCBuYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldFtuYW1lXTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgJiYgdGFyZ2V0LmdldClcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdGFyZ2V0LmdldChuYW1lKTtcclxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlKHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgdmFyIHhzID0gW10sIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhcmcgJiYgYXJnLnZhbHVlT2YpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGFyZy52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHggPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuICAgICAgICAgICAgICAgICAgICB4cy5wdXNoKHgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB4cy5wdXNoKGFyZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiK1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gKyB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gLSB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gKiB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImFzc2lnbm1lbnQgaXMgb25seSBhbGxvdyBpbiBFdmVudEJpbmRpbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgeHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQob2JzZXJ2YWJsZSkge1xyXG4gICAgICAgICAgICBpZiAoIW9ic2VydmFibGUuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgb2JzZXJ2YWJsZS5hd2FpdGVkID0gbmV3IEF3YWl0ZWQob2JzZXJ2YWJsZS52YWx1ZU9mKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm9ic2VydmUob2JzZXJ2YWJsZS5hd2FpdGVkKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGUuYXdhaXRlZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlKHBhcnRzKTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHBhcnRzLmV4ZWN1dGUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydHMuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcnRzKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IENvcmUuZW1wdHk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnQgPSB0aGlzLmV2YWx1YXRlKHBhcnRzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFydCAhPT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gcGFydDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUmVhY3RpdmU7Il19