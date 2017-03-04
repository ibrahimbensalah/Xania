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
            this.properties = [];
        }
        Value.prototype.get = function (propertyName) {
            var properties = this.properties;
            var length = properties.length;
            for (var i = 0; i < length; i++) {
                if (properties[i].name === propertyName) {
                    return properties[i];
                }
            }
            var propertyValue = this.value, initialValue = propertyValue[propertyName];
            if (initialValue === void 0)
                return void 0;
            if (typeof initialValue === "function") {
                return initialValue.bind(propertyValue);
            }
            var property = Value.createProperty(this, propertyName, initialValue);
            properties.push(property);
            return property;
        };
        Value.createProperty = function (parent, name, initialValue) {
            if (Array.isArray(initialValue)) {
                var property = new ArrayProperty(parent, name);
                property.value = initialValue;
                property.length = initialValue.length;
                return property;
            }
            else if (initialValue && initialValue.subscribe) {
                var property = new AwaitableProperty(parent, name);
                property.value = initialValue;
                return property;
            }
            else {
                var property = new ObjectProperty(parent, name);
                property.value = initialValue;
                return property;
            }
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
                return result;
            }
            return this.parent.get(name);
        };
        Property.prototype.change = function (action) {
            var actions = this.actions;
            if (actions) {
                var length = actions.length, i = length;
                while (i--) {
                    if (action === actions[i])
                        return false;
                }
                actions[length] = action;
            }
            else {
                this.actions = [action];
            }
            return this;
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
        Property.prototype.valueOf = function () {
            return this.value;
        };
        return Property;
    }(Value));
    var ArrayProperty = (function (_super) {
        __extends(ArrayProperty, _super);
        function ArrayProperty() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.length = 0;
            return _this;
        }
        ArrayProperty.prototype.refresh = function (parentValue) {
            var name = this.name, array = parentValue[name], properties = this.properties, prevLength = this.length, valueLength = array && array.length;
            if (array && properties) {
                var i = properties.length;
                while (i--) {
                    var property = properties[i];
                    var idx = array.indexOf(property.value);
                    if (idx < 0) {
                        properties.splice(i, 1);
                    }
                    else {
                        property.name = idx;
                    }
                }
            }
            this.length = valueLength;
            if (array !== this.value) {
                this.value = array;
                return true;
            }
            return valueLength !== prevLength;
        };
        return ArrayProperty;
    }(Property));
    var ObjectProperty = (function (_super) {
        __extends(ObjectProperty, _super);
        function ObjectProperty() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ObjectProperty.prototype.refresh = function (parentValue) {
            var name = this.name, newValue = parentValue[name];
            if (newValue !== this.value) {
                this.value = newValue;
                if (newValue === void 0 || newValue === null)
                    this.properties.length = 0;
                return true;
            }
            return false;
        };
        ObjectProperty.prototype.set = function (value) {
            this.parent.value[this.name] = value;
        };
        return ObjectProperty;
    }(Property));
    var AwaitableProperty = (function (_super) {
        __extends(AwaitableProperty, _super);
        function AwaitableProperty() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(AwaitableProperty.prototype, "length", {
            get: function () {
                if (Array.isArray(this.value))
                    return this.value.length;
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        AwaitableProperty.prototype.refresh = function (parentValue) {
            if (_super.prototype.refresh.call(this, parentValue)) {
                if (this.awaited) {
                    this.awaited.dispose();
                    delete this.awaited;
                }
                return true;
            }
            return false;
        };
        AwaitableProperty.prototype.await = function () {
            if (!this.awaited) {
                this.awaited = new Awaited(this.value);
            }
            return this.awaited;
        };
        return AwaitableProperty;
    }(ObjectProperty));
    var Awaited = (function () {
        function Awaited(observable) {
            this.subscription = observable.subscribe(this);
            this.current = observable.current;
        }
        Object.defineProperty(Awaited.prototype, "length", {
            get: function () {
                if (typeof this.current === "undefined")
                    return 0;
                return this.current.length;
            },
            enumerable: true,
            configurable: true
        });
        Awaited.prototype.get = function (name) {
            return this.current[name];
        };
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
        Extension.prototype.set = function (name, value) {
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
            var stackLength = 1;
            var dirty = [];
            var dirtyLength = 0;
            while (stackLength--) {
                var parent_1 = stack[stackLength];
                var properties = parent_1.properties;
                var parentValue = parent_1.value;
                var i = properties.length;
                while (i--) {
                    var child = properties[i];
                    var changed = child.refresh(parentValue);
                    stack[stackLength++] = child;
                    if (changed === true) {
                        var actions_1 = child.actions;
                        if (actions_1) {
                            dirty[dirtyLength++] = actions_1;
                        }
                    }
                }
                ;
            }
            var j = dirtyLength;
            while (j--) {
                var actions = dirty[j];
                var e = actions.length;
                while (e--) {
                    var action = actions[e];
                    action.execute();
                }
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
        function Binding() {
        }
        Binding.prototype.execute = function () {
            this.render(this.context, this.driver);
            return this;
        };
        Binding.prototype.update = function (context, driver) {
            if (this.context !== context || this.driver !== driver) {
                this.context = context;
                this.driver = driver;
                this.render(context, driver);
            }
            return this;
        };
        Binding.prototype.observe = function (value) {
            if (value && value.change) {
                value.change(this);
            }
        };
        Binding.prototype.extend = function (name, value) {
            return new Extension(this.context)
                .set(name, value);
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
                var length = source.length;
                var result = [];
                if (length === void 0)
                    return result;
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
            if (target.get) {
                var value = target.get(name);
                if (value && value.change)
                    value.change(this);
                return value;
            }
            return target[name];
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
        Binding.prototype.await = function (value) {
            if (!value.awaited) {
                var observable = value.valueOf();
                if (typeof observable.subscribe === "function")
                    value.awaited = new Awaited(observable);
                else
                    return value;
            }
            this.observe(value.awaited);
            return value.awaited;
        };
        Binding.prototype.evaluateText = function (parts) {
            if (parts.execute) {
                var result = parts.execute(this, this.context);
                return result && result.valueOf();
            }
            else if (Array.isArray(parts)) {
                var stack = parts.slice(0).reverse();
                var result = core_1.Core.empty;
                while (stack.length) {
                    var cur = stack.pop();
                    if (cur === void 0 || cur === null) {
                    }
                    else if (cur.execute) {
                        stack.push(cur.execute(this, this.context));
                    }
                    else if (Array.isArray(cur)) {
                        var i = cur.length;
                        while (i--) {
                            stack.push(cur[i]);
                        }
                    }
                    else {
                        result += cur;
                    }
                }
                return result;
            }
            else
                return parts;
        };
        Binding.prototype.evaluateObject = function (expr) {
            var _this = this;
            if (!expr)
                return expr;
            else if (expr.execute)
                return expr.execute(this, this.context);
            else if (Array.isArray(expr)) {
                return expr.map(function (x) { return _this.evaluateObject(x); });
            }
            else
                return expr;
        };
        Binding.prototype.on = function (eventName, dom, eventBinding) {
            this.driver.on(eventName, dom, eventBinding);
        };
        return Binding;
    }());
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Reactive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBOEI7QUFHOUIsSUFBYyxRQUFRLENBeWlCckI7QUF6aUJELFdBQWMsUUFBUTtJQWlCbEI7UUFBQTtZQUNXLGVBQVUsR0FBZ0IsRUFBRSxDQUFDO1FBNkN4QyxDQUFDO1FBMUNHLG1CQUFHLEdBQUgsVUFBSSxZQUFvQjtZQUNwQixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBRWpDLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDL0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQzFCLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RSxV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QUUsWUFBWTtZQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFDTCxjQUFDO0lBQUQsQ0FBQyxBQWpLRCxJQWlLQztJQWpLcUIsZ0JBQU8sVUFpSzVCLENBQUE7QUFDTCxDQUFDLEVBemlCYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQXlpQnJCOztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCI7XHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSAnLi9vYnNlcnZhYmxlcydcclxuXHJcbmV4cG9ydCBtb2R1bGUgUmVhY3RpdmUge1xyXG5cclxuICAgIGludGVyZmFjZSBJRXhwcmVzc2lvblBhcnNlciB7XHJcbiAgICAgICAgcGFyc2UoZXhwcjogc3RyaW5nKTogeyBleGVjdXRlKHNjb3BlOiB7IGdldChuYW1lOiBzdHJpbmcpIH0pIH07XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElQcm9wZXJ0eSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHZhbHVlOiBhbnk7XHJcbiAgICAgICAgcmVmcmVzaChwYXJlbnRWYWx1ZSk7XHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyB8IG51bWJlcik7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgY2xhc3MgVmFsdWUge1xyXG4gICAgICAgIHB1YmxpYyBwcm9wZXJ0aWVzOiBJUHJvcGVydHlbXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyB2YWx1ZTtcclxuXHJcbiAgICAgICAgZ2V0KHByb3BlcnR5TmFtZTogc3RyaW5nKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2ldLm5hbWUgPT09IHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZSA9IHRoaXMudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBpbml0aWFsVmFsdWUgPSBwcm9wZXJ0eVZhbHVlW3Byb3BlcnR5TmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbFZhbHVlID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsVmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluaXRpYWxWYWx1ZS5iaW5kKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBWYWx1ZS5jcmVhdGVQcm9wZXJ0eSh0aGlzLCBwcm9wZXJ0eU5hbWUsIGluaXRpYWxWYWx1ZSk7XHJcbiAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChwcm9wZXJ0eSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgY3JlYXRlUHJvcGVydHkocGFyZW50LCBuYW1lLCBpbml0aWFsVmFsdWUpOiBJUHJvcGVydHkge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbml0aWFsVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG5ldyBBcnJheVByb3BlcnR5KHBhcmVudCwgbmFtZSk7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5Lmxlbmd0aCA9IGluaXRpYWxWYWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFZhbHVlICYmIGluaXRpYWxWYWx1ZS5zdWJzY3JpYmUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gbmV3IEF3YWl0YWJsZVByb3BlcnR5KHBhcmVudCwgbmFtZSk7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gbmV3IE9iamVjdFByb3BlcnR5KHBhcmVudCwgbmFtZSk7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURlcGVuZGVuY3kge1xyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pOiBudW1iZXIgfCBib29sZWFuO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNsYXNzIFByb3BlcnR5IGV4dGVuZHMgVmFsdWUgaW1wbGVtZW50cyBJRGVwZW5kZW5jeSB7XHJcbiAgICAgICAgLy8gbGlzdCBvZiBvYnNlcnZlcnMgdG8gYmUgZGlzcGF0Y2hlZCBvbiB2YWx1ZSBjaGFuZ2VcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHBhcmVudDogVmFsdWUsIHB1YmxpYyBuYW1lKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzdXBlci5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb246IElBY3Rpb24pOiB0aGlzIHwgYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zO1xyXG4gICAgICAgICAgICBpZiAoYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGFjdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPSBsZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gYWN0aW9uc1tpXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYWN0aW9uc1tsZW5ndGhdID0gYWN0aW9uO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zID0gW2FjdGlvbl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zO1xyXG4gICAgICAgICAgICBpZiAoIWFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpZHggPSBhY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBhY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgY2xhc3MgQXJyYXlQcm9wZXJ0eSBleHRlbmRzIFByb3BlcnR5IHtcclxuXHJcbiAgICAgICAgcHVibGljIGxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgIHJlZnJlc2gocGFyZW50VmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBhcnJheSA9IHBhcmVudFZhbHVlW25hbWVdLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA9IHRoaXMucHJvcGVydGllcyxcclxuICAgICAgICAgICAgICAgIHByZXZMZW5ndGggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIHZhbHVlTGVuZ3RoID0gYXJyYXkgJiYgYXJyYXkubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFycmF5ICYmIHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5ID0gcHJvcGVydGllc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5LmluZGV4T2YocHJvcGVydHkudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5Lm5hbWUgPSBpZHg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxlbmd0aCA9IHZhbHVlTGVuZ3RoO1xyXG4gICAgICAgICAgICBpZiAoYXJyYXkgIT09IHRoaXMudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBhcnJheTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlTGVuZ3RoICE9PSBwcmV2TGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBPYmplY3RQcm9wZXJ0eSBleHRlbmRzIFByb3BlcnR5IHtcclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSBwYXJlbnRWYWx1ZVtuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG5ld1ZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldCh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnZhbHVlW3RoaXMubmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQXdhaXRhYmxlUHJvcGVydHkgZXh0ZW5kcyBPYmplY3RQcm9wZXJ0eSB7XHJcbiAgICAgICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy52YWx1ZSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaChwYXJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoc3VwZXIucmVmcmVzaChwYXJlbnRWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF3YWl0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF3YWl0ZWQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmF3YWl0ZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYXdhaXRlZDogQXdhaXRlZDtcclxuICAgICAgICBhd2FpdCgpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmF3YWl0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXdhaXRlZCA9IG5ldyBBd2FpdGVkKHRoaXMudmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmF3YWl0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBd2FpdGVkIHtcclxuICAgICAgICBwcml2YXRlIHN1YnNjcmlwdGlvbjtcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IG9ic2VydmFibGUuc3Vic2NyaWJlKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBvYnNlcnZhYmxlLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuY3VycmVudCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50Lmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uc1tpXS5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3kgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudD86IHsgZ2V0KG5hbWU6IHN0cmluZyk7IHJlZnJlc2goKTsgfSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KG5hbWU6IHN0cmluZywgdmFsdWU6IFZhbHVlKTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXNbbmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXNbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZU9mKCkgPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWZyZXNoKCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSURpc3BhdGNoZXIge1xyXG4gICAgICAgIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN0b3JlIGV4dGVuZHMgVmFsdWUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnksIHByaXZhdGUgZ2xvYmFsczogYW55ID0ge30pIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBzdXBlci5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RhdGlxID0gdGhpcy52YWx1ZS5jb25zdHJ1Y3RvciAmJiB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRpcSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpcS5iaW5kKHRoaXMudmFsdWUuY29uc3RydWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXRpcSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ2xvYmFscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmdsb2JhbHNbaV1bbmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZyAhPT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaCgpIHtcclxuICAgICAgICAgICAgdmFyIHN0YWNrOiB7IHByb3BlcnRpZXMsIHZhbHVlIH1bXSA9IFt0aGlzXTtcclxuICAgICAgICAgICAgdmFyIHN0YWNrTGVuZ3RoOiBudW1iZXIgPSAxO1xyXG4gICAgICAgICAgICB2YXIgZGlydHk6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIHZhciBkaXJ0eUxlbmd0aDogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChzdGFja0xlbmd0aC0tKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzdGFja1tzdGFja0xlbmd0aF07XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHBhcmVudC5wcm9wZXJ0aWVzO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VmFsdWUgPSBwYXJlbnQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaTogbnVtYmVyID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gcHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlZCA9IGNoaWxkLnJlZnJlc2gocGFyZW50VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrTGVuZ3RoKytdID0gY2hpbGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBjaGlsZC5hY3Rpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlydHlbZGlydHlMZW5ndGgrK10gPSBhY3Rpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGogPSBkaXJ0eUxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGotLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSBkaXJ0eVtqXTtcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGFjdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGUtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSwgbnVsbCwgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIERlZmF1bHREaXNwYXRjaGVyIHtcclxuICAgICAgICBzdGF0aWMgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElEcml2ZXIge1xyXG4gICAgICAgIGluc2VydChzZW5kZXI6IEJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGNvbnRleHQ7XHJcbiAgICAgICAgcHJvdGVjdGVkIGRyaXZlcjtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoO1xyXG4gICAgICAgIHB1YmxpYyBjaGlsZEJpbmRpbmdzOiBCaW5kaW5nW107XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHRoaXMuY29udGV4dCwgdGhpcy5kcml2ZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0LCBkcml2ZXI6IElEcml2ZXIpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29udGV4dCAhPT0gY29udGV4dCB8fCB0aGlzLmRyaXZlciAhPT0gZHJpdmVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcml2ZXIgPSBkcml2ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9ic2VydmUodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLmNoYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuY2hhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWJzdHJhY3QgcmVuZGVyPyhjb250ZXh0LCBkcml2ZXIpOiBhbnk7XHJcblxyXG4gICAgICAgIGV4dGVuZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHRlbnNpb24odGhpcy5jb250ZXh0KVxyXG4gICAgICAgICAgICAgICAgLnNldChuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gbGVuZ3RoLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXh0ID0gdGhpcy5leHRlbmQocGFyYW0sIHNvdXJjZS5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5kKHBhcmFtLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW1iZXIodGFyZ2V0OiB7IGdldChuYW1lOiBzdHJpbmcpIH0sIG5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKHRhcmdldC5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuY2hhbmdlKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmNoYW5nZSh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIHZhciB4cyA9IFtdLCBsZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJnICYmIGFyZy52YWx1ZU9mKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBhcmcudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh4ID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICAgICAgeHMucHVzaCh4KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeHMucHVzaChhcmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcIitcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdICsgeHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdIC0geHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIipcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdICogeHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhc3NpZ25tZW50IGlzIG9ubHkgYWxsb3cgaW4gRXZlbnRCaW5kaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIHhzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICghdmFsdWUuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9ic2VydmFibGUgPSB2YWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9ic2VydmFibGUuc3Vic2NyaWJlID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYXdhaXRlZCA9IG5ldyBBd2FpdGVkKG9ic2VydmFibGUpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlKHZhbHVlLmF3YWl0ZWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXdhaXRlZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlVGV4dChwYXJ0cyk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJ0cy5leGVjdXRlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gcGFydHMuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFydHMpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBwYXJ0cy5zbGljZSgwKS5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gQ29yZS5lbXB0eTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdm9pZCAwIHx8IGN1ciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIFxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChjdXIuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IGN1ci5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goY3VyW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjdXI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGVPYmplY3QoZXhwcik6IGFueSB7XHJcbiAgICAgICAgICAgIGlmICghZXhwcilcclxuICAgICAgICAgICAgICAgIHJldHVybiBleHByO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChleHByLmV4ZWN1dGUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwci5leGVjdXRlKHRoaXMsIHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZXhwcikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBleHByLm1hcCh4ID0+IHRoaXMuZXZhbHVhdGVPYmplY3QoeCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBleHByO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvbihldmVudE5hbWUsIGRvbSwgZXZlbnRCaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyLm9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUmVhY3RpdmU7Il19