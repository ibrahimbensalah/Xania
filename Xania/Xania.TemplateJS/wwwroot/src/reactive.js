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
        Property.prototype.set = function (value) {
            this.parent.value[this.name] = value;
        };
        Property.prototype.valueOf = function () {
            return this.value;
        };
        return Property;
    }(Value));
    var ArrayProperty = (function (_super) {
        __extends(ArrayProperty, _super);
        function ArrayProperty() {
            var _this = _super.apply(this, arguments) || this;
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
        ArrayProperty.prototype.indexOf = function (item) {
            return this.value.indexOf(item);
        };
        return ArrayProperty;
    }(Property));
    var ObjectProperty = (function (_super) {
        __extends(ObjectProperty, _super);
        function ObjectProperty() {
            return _super.apply(this, arguments) || this;
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
        return ObjectProperty;
    }(Property));
    var AwaitableProperty = (function (_super) {
        __extends(AwaitableProperty, _super);
        function AwaitableProperty() {
            return _super.apply(this, arguments) || this;
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
            this.current = observable.valueOf();
        }
        Object.defineProperty(Awaited.prototype, "length", {
            get: function () {
                if (typeof this.current === "undefined" || this.current === null)
                    return 0;
                var length = this.current.length;
                return length;
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
        Awaited.prototype.indexOf = function (item) {
            return this.current.indexOf(item);
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
        Store.prototype.refresh = function (mutable) {
            if (mutable === void 0) { mutable = true; }
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
                    if (mutable || changed) {
                        stack[stackLength++] = child;
                        if (changed === true) {
                            var actions_1 = child.actions;
                            if (actions_1) {
                                dirty[dirtyLength++] = actions_1;
                            }
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
    var ListItem = (function () {
        function ListItem(name, value) {
            this.name = name;
            this.value = value;
        }
        ListItem.prototype.get = function (name) {
            if (name === this.name)
                return this.value;
            return void 0;
        };
        return ListItem;
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
                var len = +length;
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
        Binding.prototype.extend = function (name, value) {
            if (value === null || value === void 0)
                return value;
            return new ListItem(name, value);
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
        Binding.prototype.evaluateText = function (parts, context) {
            if (context === void 0) { context = this.context; }
            if (parts.execute) {
                var result = parts.execute(this, context);
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
                        stack.push(cur.execute(this, context));
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
        Binding.prototype.evaluateObject = function (expr, context) {
            var _this = this;
            if (context === void 0) { context = this.context; }
            if (!expr)
                return expr;
            else if (expr.execute)
                return expr.execute(this, context);
            else if (Array.isArray(expr)) {
                return expr.map(function (x) { return _this.evaluateObject(x, context); });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBOEI7QUFHOUIsSUFBYyxRQUFRLENBZ2tCckI7QUFoa0JELFdBQWMsUUFBUTtJQWlCbEI7UUFBQTtZQUNXLGVBQVUsR0FBZ0IsRUFBRSxDQUFDO1FBNkN4QyxDQUFDO1FBMUNHLG1CQUFHLEdBQUgsVUFBSSxZQUFvQjtZQUNwQixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBRWpDLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDL0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQzFCLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RSxV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QTtBQUNMLENBQUMsRUFoa0JhLFFBQVEsR0FBUixnQkFBUSxLQUFSLGdCQUFRLFFBZ2tCckI7O0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuL2NvcmVcIjtcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tICcuL29ic2VydmFibGVzJ1xyXG5cclxuZXhwb3J0IG1vZHVsZSBSZWFjdGl2ZSB7XHJcblxyXG4gICAgaW50ZXJmYWNlIElFeHByZXNzaW9uUGFyc2VyIHtcclxuICAgICAgICBwYXJzZShleHByOiBzdHJpbmcpOiB7IGV4ZWN1dGUoc2NvcGU6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSkgfTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElBY3Rpb24ge1xyXG4gICAgICAgIGV4ZWN1dGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVByb3BlcnR5IHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmFsdWU6IGFueTtcclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKTtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHVibGljIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdID0gW107XHJcbiAgICAgICAgcHVibGljIHZhbHVlO1xyXG5cclxuICAgICAgICBnZXQocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBJUHJvcGVydHkge1xyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHRoaXMucHJvcGVydGllcztcclxuXHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBwcm9wZXJ0aWVzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbaV0ubmFtZSA9PT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlID0gdGhpcy52YWx1ZSxcclxuICAgICAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IHByb3BlcnR5VmFsdWVbcHJvcGVydHlOYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsVmFsdWUgPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5pdGlhbFZhbHVlLmJpbmQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IFZhbHVlLmNyZWF0ZVByb3BlcnR5KHRoaXMsIHByb3BlcnR5TmFtZSwgaW5pdGlhbFZhbHVlKTtcclxuICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjcmVhdGVQcm9wZXJ0eShwYXJlbnQsIG5hbWUsIGluaXRpYWxWYWx1ZSk6IElQcm9wZXJ0eSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGluaXRpYWxWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gbmV3IEFycmF5UHJvcGVydHkocGFyZW50LCBuYW1lKTtcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlID0gaW5pdGlhbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkubGVuZ3RoID0gaW5pdGlhbFZhbHVlLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsVmFsdWUgJiYgaW5pdGlhbFZhbHVlLnN1YnNjcmliZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBuZXcgQXdhaXRhYmxlUHJvcGVydHkocGFyZW50LCBuYW1lKTtcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlID0gaW5pdGlhbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBuZXcgT2JqZWN0UHJvcGVydHkocGFyZW50LCBuYW1lKTtcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlID0gaW5pdGlhbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGVwZW5kZW5jeSB7XHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbik6IG51bWJlciB8IGJvb2xlYW47XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgY2xhc3MgUHJvcGVydHkgZXh0ZW5kcyBWYWx1ZSBpbXBsZW1lbnRzIElEZXBlbmRlbmN5IHtcclxuICAgICAgICAvLyBsaXN0IG9mIG9ic2VydmVycyB0byBiZSBkaXNwYXRjaGVkIG9uIHZhbHVlIGNoYW5nZVxyXG4gICAgICAgIHByaXZhdGUgYWN0aW9uczogSUFjdGlvbltdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcGFyZW50OiBWYWx1ZSwgcHVibGljIG5hbWUpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHN1cGVyLmdldChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hhbmdlKGFjdGlvbjogSUFjdGlvbik6IHRoaXMgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgIGlmIChhY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gYWN0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IGxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSBhY3Rpb25zW2ldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zW2xlbmd0aF0gPSBhY3Rpb247XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBbYWN0aW9uXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgIGlmICghYWN0aW9ucylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGFjdGlvbnMuaW5kZXhPZihhY3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQudmFsdWVbdGhpcy5uYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjbGFzcyBBcnJheVByb3BlcnR5IGV4dGVuZHMgUHJvcGVydHkge1xyXG5cclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgcmVmcmVzaChwYXJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgIGFycmF5ID0gcGFyZW50VmFsdWVbbmFtZV0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICAgICAgcHJldkxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVMZW5ndGggPSBhcnJheSAmJiBhcnJheS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJyYXkgJiYgcHJvcGVydGllcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGkgPSBwcm9wZXJ0aWVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkuaW5kZXhPZihwcm9wZXJ0eS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkubmFtZSA9IGlkeDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gdmFsdWVMZW5ndGg7XHJcbiAgICAgICAgICAgIGlmIChhcnJheSAhPT0gdGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGFycmF5O1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVMZW5ndGggIT09IHByZXZMZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbmRleE9mKGl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUuaW5kZXhPZihpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgT2JqZWN0UHJvcGVydHkgZXh0ZW5kcyBQcm9wZXJ0eSB7XHJcbiAgICAgICAgcmVmcmVzaChwYXJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gcGFyZW50VmFsdWVbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHZvaWQgMCB8fCBuZXdWYWx1ZSA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIEF3YWl0YWJsZVByb3BlcnR5IGV4dGVuZHMgT2JqZWN0UHJvcGVydHkge1xyXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMudmFsdWUpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlZnJlc2gocGFyZW50VmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHN1cGVyLnJlZnJlc2gocGFyZW50VmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hd2FpdGVkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5hd2FpdGVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGF3YWl0ZWQ6IEF3YWl0ZWQ7XHJcbiAgICAgICAgYXdhaXQoKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF3YWl0ZWQgPSBuZXcgQXdhaXRlZCh0aGlzLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hd2FpdGVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXdhaXRlZCB7XHJcbiAgICAgICAgcHJpdmF0ZSBzdWJzY3JpcHRpb247XHJcbiAgICAgICAgcHJpdmF0ZSBhY3Rpb25zOiBJQWN0aW9uW107XHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihvYnNlcnZhYmxlOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24gPSBvYnNlcnZhYmxlLnN1YnNjcmliZSh0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gb2JzZXJ2YWJsZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuY3VycmVudCA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0aGlzLmN1cnJlbnQgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuY3VycmVudC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHJldHVybiBsZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQobmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudCAhPT0gbmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnNbaV0uZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hhbmdlKGFjdGlvbjogSUFjdGlvbik6IElEZXBlbmRlbmN5IHwgYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBbYWN0aW9uXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMucHVzaChhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYWN0aW9ucylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5kZXhPZihpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQuaW5kZXhPZihpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV4dGVuc2lvbiB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50PzogeyBnZXQobmFtZTogc3RyaW5nKTsgcmVmcmVzaCgpOyB9KSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXQobmFtZTogc3RyaW5nLCB2YWx1ZTogVmFsdWUpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpc1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlT2YoKSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlZnJlc2goKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnJlZnJlc2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3RvcmUgZXh0ZW5kcyBWYWx1ZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IodmFsdWU6IGFueSwgcHJpdmF0ZSBnbG9iYWxzOiBhbnkgPSB7fSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1cGVyLmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzdGF0aXEgPSB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yICYmIHRoaXMudmFsdWUuY29uc3RydWN0b3JbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGlxID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxLmJpbmQodGhpcy52YWx1ZS5jb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGlxICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5nbG9iYWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZyA9IHRoaXMuZ2xvYmFsc1tpXVtuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChnICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWZyZXNoKG11dGFibGUgPSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHZhciBzdGFjazogeyBwcm9wZXJ0aWVzLCB2YWx1ZSB9W10gPSBbdGhpc107XHJcbiAgICAgICAgICAgIHZhciBzdGFja0xlbmd0aDogbnVtYmVyID0gMTtcclxuICAgICAgICAgICAgdmFyIGRpcnR5OiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgZGlydHlMZW5ndGg6IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoc3RhY2tMZW5ndGgtLSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc3RhY2tbc3RhY2tMZW5ndGhdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBwYXJlbnQucHJvcGVydGllcztcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudFZhbHVlID0gcGFyZW50LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGk6IG51bWJlciA9IHByb3BlcnRpZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoYW5nZWQgPSBjaGlsZC5yZWZyZXNoKHBhcmVudFZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXV0YWJsZSB8fCBjaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrTGVuZ3RoKytdID0gY2hpbGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGNoaWxkLmFjdGlvbnM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcnR5W2RpcnR5TGVuZ3RoKytdID0gYWN0aW9ucztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBqID0gZGlydHlMZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb25zID0gZGlydHlbal07XHJcbiAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgdmFyIGUgPSBhY3Rpb25zLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gYWN0aW9uc1tlXTtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUsIG51bGwsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBEZWZhdWx0RGlzcGF0Y2hlciB7XHJcbiAgICAgICAgc3RhdGljIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24uZXhlY3V0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJRHJpdmVyIHtcclxuICAgICAgICBpbnNlcnQoc2VuZGVyOiBCaW5kaW5nLCBkb20sIGlkeCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgTGlzdEl0ZW0ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbmFtZTogc3RyaW5nLCBwcml2YXRlIHZhbHVlOiBhbnkpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSB0aGlzLm5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBjb250ZXh0O1xyXG4gICAgICAgIHByb3RlY3RlZCBkcml2ZXI7XHJcbiAgICAgICAgcHVibGljIGxlbmd0aDtcclxuICAgICAgICBwdWJsaWMgY2hpbGRCaW5kaW5nczogQmluZGluZ1tdO1xyXG5cclxuICAgICAgICBleGVjdXRlKCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmNvbnRleHQsIHRoaXMuZHJpdmVyKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCwgZHJpdmVyOiBJRHJpdmVyKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRleHQgIT09IGNvbnRleHQgfHwgdGhpcy5kcml2ZXIgIT09IGRyaXZlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJpdmVyID0gZHJpdmVyO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvYnNlcnZlKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLmNoYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFic3RyYWN0IHJlbmRlcj8oY29udGV4dCwgZHJpdmVyKTogYW55O1xyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gK2xlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXh0ID0gdGhpcy5leHRlbmQocGFyYW0sIHNvdXJjZS5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5kKHBhcmFtLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IExpc3RJdGVtKG5hbWUsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmdldChuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuY2hhbmdlKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgdmFyIHhzID0gW10sIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhcmcgJiYgYXJnLnZhbHVlT2YpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGFyZy52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHggPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuICAgICAgICAgICAgICAgICAgICB4cy5wdXNoKHgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB4cy5wdXNoKGFyZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiK1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gKyB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gLSB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gKiB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImFzc2lnbm1lbnQgaXMgb25seSBhbGxvdyBpbiBFdmVudEJpbmRpbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgeHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKCF2YWx1ZS5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JzZXJ2YWJsZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JzZXJ2YWJsZS5zdWJzY3JpYmUgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hd2FpdGVkID0gbmV3IEF3YWl0ZWQob2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm9ic2VydmUodmFsdWUuYXdhaXRlZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hd2FpdGVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGVUZXh0KHBhcnRzLCBjb250ZXh0ID0gdGhpcy5jb250ZXh0KTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHBhcnRzLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBwYXJ0cy5leGVjdXRlKHRoaXMsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFydHMpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBwYXJ0cy5zbGljZSgwKS5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gQ29yZS5lbXB0eTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdm9pZCAwIHx8IGN1ciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIFxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChjdXIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGN1cikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBjdXIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGN1cltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gY3VyO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlT2JqZWN0KGV4cHIsIGNvbnRleHQgPSB0aGlzLmNvbnRleHQpOiBhbnkge1xyXG4gICAgICAgICAgICBpZiAoIWV4cHIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwcjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXhwci5leGVjdXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShleHByKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHIubWFwKHggPT4gdGhpcy5ldmFsdWF0ZU9iamVjdCh4LCBjb250ZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIub24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBSZWFjdGl2ZTsiXX0=