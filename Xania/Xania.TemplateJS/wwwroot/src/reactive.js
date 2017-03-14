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
        ArrayProperty.prototype.indexOf = function (item) {
            return this.value.indexOf(item);
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
            return this.childBindings;
        };
        Binding.prototype.update2 = function (context, driver) {
            this.context = context;
            this.driver = driver;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBOEI7QUFHOUIsSUFBYyxRQUFRLENBNGpCckI7QUE1akJELFdBQWMsUUFBUTtJQWlCbEI7UUFBQTtZQUNXLGVBQVUsR0FBZ0IsRUFBRSxDQUFDO1FBNkN4QyxDQUFDO1FBMUNHLG1CQUFHLEdBQUgsVUFBSSxZQUFvQjtZQUNwQixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBRWpDLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDL0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQzFCLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RSxV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cnZhYmxlcyB9IGZyb20gJy4vb2JzZXJ2YWJsZXMnXHJcblxyXG5leHBvcnQgbW9kdWxlIFJlYWN0aXZlIHtcclxuXHJcbiAgICBpbnRlcmZhY2UgSUV4cHJlc3Npb25QYXJzZXIge1xyXG4gICAgICAgIHBhcnNlKGV4cHI6IHN0cmluZyk6IHsgZXhlY3V0ZShzY29wZTogeyBnZXQobmFtZTogc3RyaW5nKSB9KSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUFjdGlvbiB7XHJcbiAgICAgICAgZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJUHJvcGVydHkge1xyXG4gICAgICAgIG5hbWU6IHN0cmluZztcclxuICAgICAgICB2YWx1ZTogYW55O1xyXG4gICAgICAgIHJlZnJlc2gocGFyZW50VmFsdWUpO1xyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcgfCBudW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNsYXNzIFZhbHVlIHtcclxuICAgICAgICBwdWJsaWMgcHJvcGVydGllczogSVByb3BlcnR5W10gPSBbXTtcclxuICAgICAgICBwdWJsaWMgdmFsdWU7XHJcblxyXG4gICAgICAgIGdldChwcm9wZXJ0eU5hbWU6IHN0cmluZyk6IElQcm9wZXJ0eSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0aWVzO1xyXG5cclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHByb3BlcnRpZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1tpXS5uYW1lID09PSBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gcHJvcGVydHlWYWx1ZVtwcm9wZXJ0eU5hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbFZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbml0aWFsVmFsdWUuYmluZChwcm9wZXJ0eVZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gVmFsdWUuY3JlYXRlUHJvcGVydHkodGhpcywgcHJvcGVydHlOYW1lLCBpbml0aWFsVmFsdWUpO1xyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KHBhcmVudCwgbmFtZSwgaW5pdGlhbFZhbHVlKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5pdGlhbFZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBuZXcgQXJyYXlQcm9wZXJ0eShwYXJlbnQsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWUgPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eS5sZW5ndGggPSBpbml0aWFsVmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxWYWx1ZSAmJiBpbml0aWFsVmFsdWUuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG5ldyBBd2FpdGFibGVQcm9wZXJ0eShwYXJlbnQsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWUgPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG5ldyBPYmplY3RQcm9wZXJ0eShwYXJlbnQsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWUgPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEZXBlbmRlbmN5IHtcclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKTogbnVtYmVyIHwgYm9vbGVhbjtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBQcm9wZXJ0eSBleHRlbmRzIFZhbHVlIGltcGxlbWVudHMgSURlcGVuZGVuY3kge1xyXG4gICAgICAgIC8vIGxpc3Qgb2Ygb2JzZXJ2ZXJzIHRvIGJlIGRpc3BhdGNoZWQgb24gdmFsdWUgY2hhbmdlXHJcbiAgICAgICAgcHJpdmF0ZSBhY3Rpb25zOiBJQWN0aW9uW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBwYXJlbnQ6IFZhbHVlLCBwdWJsaWMgbmFtZSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogdGhpcyB8IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucztcclxuICAgICAgICAgICAgaWYgKGFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBhY3Rpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpID0gbGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IGFjdGlvbnNbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFjdGlvbnNbbGVuZ3RoXSA9IGFjdGlvbjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucztcclxuICAgICAgICAgICAgaWYgKCFhY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaWR4ID0gYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgYWN0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXQodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGNsYXNzIEFycmF5UHJvcGVydHkgZXh0ZW5kcyBQcm9wZXJ0eSB7XHJcblxyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAwO1xyXG5cclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgYXJyYXkgPSBwYXJlbnRWYWx1ZVtuYW1lXSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXMsXHJcbiAgICAgICAgICAgICAgICBwcmV2TGVuZ3RoID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZUxlbmd0aCA9IGFycmF5ICYmIGFycmF5Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcnJheSAmJiBwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSA9IHByb3BlcnRpZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eSA9IHByb3BlcnRpZXNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZHggPSBhcnJheS5pbmRleE9mKHByb3BlcnR5LnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaWR4IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eS5uYW1lID0gaWR4O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5sZW5ndGggPSB2YWx1ZUxlbmd0aDtcclxuICAgICAgICAgICAgaWYgKGFycmF5ICE9PSB0aGlzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gYXJyYXk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZUxlbmd0aCAhPT0gcHJldkxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZGV4T2YoaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5pbmRleE9mKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBPYmplY3RQcm9wZXJ0eSBleHRlbmRzIFByb3BlcnR5IHtcclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSBwYXJlbnRWYWx1ZVtuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG5ld1ZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQXdhaXRhYmxlUHJvcGVydHkgZXh0ZW5kcyBPYmplY3RQcm9wZXJ0eSB7XHJcbiAgICAgICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy52YWx1ZSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaChwYXJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoc3VwZXIucmVmcmVzaChwYXJlbnRWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF3YWl0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF3YWl0ZWQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmF3YWl0ZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYXdhaXRlZDogQXdhaXRlZDtcclxuICAgICAgICBhd2FpdCgpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmF3YWl0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXdhaXRlZCA9IG5ldyBBd2FpdGVkKHRoaXMudmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmF3YWl0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBd2FpdGVkIHtcclxuICAgICAgICBwcml2YXRlIHN1YnNjcmlwdGlvbjtcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IG9ic2VydmFibGUuc3Vic2NyaWJlKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBvYnNlcnZhYmxlLnZhbHVlT2YoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5jdXJyZW50ID09PSBcInVuZGVmaW5lZFwiIHx8IHRoaXMuY3VycmVudCA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5jdXJyZW50Lmxlbmd0aDtcclxuICAgICAgICAgICAgcmV0dXJuIGxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uc1tpXS5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3kgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbmRleE9mKGl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudC5pbmRleE9mKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRXh0ZW5zaW9uIHtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ/OiB7IGdldChuYW1lOiBzdHJpbmcpOyByZWZyZXNoKCk7IH0pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUudmFsdWVPZigpID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaCgpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBkaXNwYXRjaChhY3Rpb246IElBY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdG9yZSBleHRlbmRzIFZhbHVlIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcih2YWx1ZTogYW55LCBwcml2YXRlIGdsb2JhbHM6IGFueSA9IHt9KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0YXRpcSA9IHRoaXMudmFsdWUuY29uc3RydWN0b3IgJiYgdGhpcy52YWx1ZS5jb25zdHJ1Y3RvcltuYW1lXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0aXEgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXEuYmluZCh0aGlzLnZhbHVlLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0aXEgIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpcTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdsb2JhbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBnID0gdGhpcy5nbG9iYWxzW2ldW25hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGcgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlZnJlc2gobXV0YWJsZSA9IHRydWUpIHtcclxuICAgICAgICAgICAgdmFyIHN0YWNrOiB7IHByb3BlcnRpZXMsIHZhbHVlIH1bXSA9IFt0aGlzXTtcclxuICAgICAgICAgICAgdmFyIHN0YWNrTGVuZ3RoOiBudW1iZXIgPSAxO1xyXG4gICAgICAgICAgICB2YXIgZGlydHk6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIHZhciBkaXJ0eUxlbmd0aDogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChzdGFja0xlbmd0aC0tKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzdGFja1tzdGFja0xlbmd0aF07XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHBhcmVudC5wcm9wZXJ0aWVzO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VmFsdWUgPSBwYXJlbnQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaTogbnVtYmVyID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gcHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlZCA9IGNoaWxkLnJlZnJlc2gocGFyZW50VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtdXRhYmxlIHx8IGNoYW5nZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tMZW5ndGgrK10gPSBjaGlsZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gY2hpbGQuYWN0aW9ucztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlydHlbZGlydHlMZW5ndGgrK10gPSBhY3Rpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGogPSBkaXJ0eUxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGotLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSBkaXJ0eVtqXTtcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGFjdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGUtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSwgbnVsbCwgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIERlZmF1bHREaXNwYXRjaGVyIHtcclxuICAgICAgICBzdGF0aWMgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElEcml2ZXIge1xyXG4gICAgICAgIGluc2VydChzZW5kZXI6IEJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBMaXN0SXRlbSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBuYW1lOiBzdHJpbmcsIHByaXZhdGUgdmFsdWU6IGFueSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHRoaXMubmFtZSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGNvbnRleHQ7XHJcbiAgICAgICAgcHJvdGVjdGVkIGRyaXZlcjtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoO1xyXG4gICAgICAgIHB1YmxpYyBjaGlsZEJpbmRpbmdzOiBCaW5kaW5nW107XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoKTogQmluZGluZ1tdIHtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jb250ZXh0LCB0aGlzLmRyaXZlcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNoaWxkQmluZGluZ3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUyKGNvbnRleHQsIGRyaXZlcjogSURyaXZlcik6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICB0aGlzLmRyaXZlciA9IGRyaXZlcjtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvYnNlcnZlKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLmNoYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFic3RyYWN0IHJlbmRlcj8oY29udGV4dCwgZHJpdmVyKTogYW55O1xyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gK2xlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXh0ID0gdGhpcy5leHRlbmQocGFyYW0sIHNvdXJjZS5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5kKHBhcmFtLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IExpc3RJdGVtKG5hbWUsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmdldChuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuY2hhbmdlKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgdmFyIHhzID0gW10sIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhcmcgJiYgYXJnLnZhbHVlT2YpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGFyZy52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHggPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuICAgICAgICAgICAgICAgICAgICB4cy5wdXNoKHgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB4cy5wdXNoKGFyZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiK1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gKyB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gLSB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geHNbMV0gKiB4c1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImFzc2lnbm1lbnQgaXMgb25seSBhbGxvdyBpbiBFdmVudEJpbmRpbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgeHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKCF2YWx1ZS5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JzZXJ2YWJsZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JzZXJ2YWJsZS5zdWJzY3JpYmUgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hd2FpdGVkID0gbmV3IEF3YWl0ZWQob2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm9ic2VydmUodmFsdWUuYXdhaXRlZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hd2FpdGVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGVUZXh0KHBhcnRzLCBjb250ZXh0ID0gdGhpcy5jb250ZXh0KTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHBhcnRzLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBwYXJ0cy5leGVjdXRlKHRoaXMsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFydHMpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBwYXJ0cy5zbGljZSgwKS5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gQ29yZS5lbXB0eTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ciA9PT0gdm9pZCAwIHx8IGN1ciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIFxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChjdXIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGN1cikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBjdXIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGN1cltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gY3VyO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlT2JqZWN0KGV4cHIsIGNvbnRleHQgPSB0aGlzLmNvbnRleHQpOiBhbnkge1xyXG4gICAgICAgICAgICBpZiAoIWV4cHIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwcjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXhwci5leGVjdXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShleHByKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHIubWFwKHggPT4gdGhpcy5ldmFsdWF0ZU9iamVjdCh4LCBjb250ZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIub24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBSZWFjdGl2ZTsiXX0=