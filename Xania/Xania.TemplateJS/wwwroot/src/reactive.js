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
            var property = Value.createProperty(this, propertyName, initialValue);
            if (!properties)
                this.properties = [property];
            else
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
        Property.prototype.set = function (value) {
            this.parent.value[this.name] = value;
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
            var name = this.name, array = parentValue[name], properties = this.properties, prevLength = this.length, valueLength = array.length;
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
        return ObjectProperty;
    }(Property));
    var AwaitableProperty = (function (_super) {
        __extends(AwaitableProperty, _super);
        function AwaitableProperty() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
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
            var stackLength = 1;
            var dirty = [];
            var dirtyLength = 0;
            while (stackLength--) {
                var parent_1 = stack[stackLength];
                var properties = parent_1.properties;
                if (properties) {
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
            var key = value;
            for (var i = 0; this.extensions && i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.key === key) {
                    return x.extension.add(name, value);
                }
            }
            var extension = new Extension(this.context)
                .add(name, value);
            if (!this.extensions)
                this.extensions = [{ key: key, extension: extension }];
            else
                this.extensions.push({ key: key, extension: extension });
            return extension;
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
                this.observe(source);
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
        Binding.prototype.await = function (observable) {
            if (!observable.awaited) {
                observable.awaited = new Awaited(observable.valueOf());
            }
            this.observe(observable.awaited);
            return observable.awaited;
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
        return Binding;
    }());
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Reactive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWFjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBOEI7QUFHOUIsSUFBYyxRQUFRLENBNGlCckI7QUE1aUJELFdBQWMsUUFBUTtJQWlCbEI7UUFBQTtRQXNEQSxDQUFDO1FBbERHLG1CQUFHLEdBQUgsVUFBSSxZQUFvQjtZQUNwQixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBRWpDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUMvQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUM5QixFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQ3RDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7WUFFRCxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUMxQixZQUFZLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRS9DLEVBQUUsQ0FBQyxDQUFDLFlBQVksS0FBSyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWxCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sWUFBWSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFRCxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUks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QUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBdEIsQ0FBc0IsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxJQUFJO2dCQUNBLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDcEIsQ0FBQztRQUNMLGNBQUM7SUFBRCxDQUFDLEFBMUtELElBMEtDO0lBMUtxQixnQkFBTyxVQTBLNUIsQ0FBQTtBQUNMLENBQUMsRUE1aUJhLFFBQVEsR0FBUixnQkFBUSxLQUFSLGdCQUFRLFFBNGlCckI7O0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuL2NvcmVcIjtcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tICcuL29ic2VydmFibGVzJ1xyXG5cclxuZXhwb3J0IG1vZHVsZSBSZWFjdGl2ZSB7XHJcblxyXG4gICAgaW50ZXJmYWNlIElFeHByZXNzaW9uUGFyc2VyIHtcclxuICAgICAgICBwYXJzZShleHByOiBzdHJpbmcpOiB7IGV4ZWN1dGUoc2NvcGU6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSkgfTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElBY3Rpb24ge1xyXG4gICAgICAgIGV4ZWN1dGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVByb3BlcnR5IHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmFsdWU6IGFueTtcclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKTtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHVibGljIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdO1xyXG4gICAgICAgIHB1YmxpYyB2YWx1ZTtcclxuXHJcbiAgICAgICAgZ2V0KHByb3BlcnR5TmFtZTogc3RyaW5nKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbaV0ubmFtZSA9PT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gcHJvcGVydHlWYWx1ZVtwcm9wZXJ0eU5hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbFZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbml0aWFsVmFsdWUuYmluZChwcm9wZXJ0eVZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gVmFsdWUuY3JlYXRlUHJvcGVydHkodGhpcywgcHJvcGVydHlOYW1lLCBpbml0aWFsVmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gW3Byb3BlcnR5XTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRoaXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KHBhcmVudCwgbmFtZSwgaW5pdGlhbFZhbHVlKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5pdGlhbFZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBuZXcgQXJyYXlQcm9wZXJ0eShwYXJlbnQsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWUgPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eS5sZW5ndGggPSBpbml0aWFsVmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxWYWx1ZSAmJiBpbml0aWFsVmFsdWUuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBuZXcgQXdhaXRhYmxlUHJvcGVydHkocGFyZW50LCBuYW1lKTtcclxuICAgICAgICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcclxuICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG5ldyBPYmplY3RQcm9wZXJ0eShwYXJlbnQsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWUgPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEZXBlbmRlbmN5IHtcclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKTogbnVtYmVyIHwgYm9vbGVhbjtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBQcm9wZXJ0eSBleHRlbmRzIFZhbHVlIGltcGxlbWVudHMgSURlcGVuZGVuY3kge1xyXG4gICAgICAgIC8vIGxpc3Qgb2Ygb2JzZXJ2ZXJzIHRvIGJlIGRpc3BhdGNoZWQgb24gdmFsdWUgY2hhbmdlXHJcbiAgICAgICAgcHJpdmF0ZSBhY3Rpb25zOiBJQWN0aW9uW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBWYWx1ZSwgcHVibGljIG5hbWUpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHN1cGVyLmdldChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hhbmdlKGFjdGlvbjogSUFjdGlvbik6IHRoaXMgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgIGlmIChhY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gYWN0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IGxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSBhY3Rpb25zW2ldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zW2xlbmd0aF0gPSBhY3Rpb247XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBbYWN0aW9uXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgIGlmICghYWN0aW9ucylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGFjdGlvbnMuaW5kZXhPZihhY3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXQodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjbGFzcyBBcnJheVByb3BlcnR5IGV4dGVuZHMgUHJvcGVydHkge1xyXG5cclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgcmVmcmVzaChwYXJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgIGFycmF5ID0gcGFyZW50VmFsdWVbbmFtZV0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICAgICAgcHJldkxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVMZW5ndGggPSBhcnJheS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJyYXkgJiYgcHJvcGVydGllcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGkgPSBwcm9wZXJ0aWVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkuaW5kZXhPZihwcm9wZXJ0eS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkubmFtZSA9IGlkeDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gdmFsdWVMZW5ndGg7XHJcbiAgICAgICAgICAgIGlmIChhcnJheSAhPT0gdGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGFycmF5O1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVMZW5ndGggIT09IHByZXZMZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIE9iamVjdFByb3BlcnR5IGV4dGVuZHMgUHJvcGVydHkge1xyXG4gICAgICAgIHJlZnJlc2gocGFyZW50VmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHBhcmVudFZhbHVlW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB0aGlzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB2b2lkIDAgfHwgbmV3VmFsdWUgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBBd2FpdGFibGVQcm9wZXJ0eSBleHRlbmRzIE9iamVjdFByb3BlcnR5IHtcclxuICAgICAgICByZWZyZXNoKHBhcmVudFZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChzdXBlci5yZWZyZXNoKHBhcmVudFZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXdhaXRlZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYXdhaXRlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhd2FpdGVkOiBBd2FpdGVkO1xyXG4gICAgICAgIGF3YWl0KCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hd2FpdGVkID0gbmV3IEF3YWl0ZWQodGhpcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXdhaXRlZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEF3YWl0ZWQge1xyXG4gICAgICAgIHByaXZhdGUgc3Vic2NyaXB0aW9uO1xyXG4gICAgICAgIHByaXZhdGUgYWN0aW9uczogSUFjdGlvbltdO1xyXG4gICAgICAgIHByaXZhdGUgY3VycmVudDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3Iob2JzZXJ2YWJsZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gb2JzZXJ2YWJsZS5zdWJzY3JpYmUodGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG9ic2VydmFibGUuY3VycmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uc1tpXS5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3kgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudD86IHsgZ2V0KG5hbWU6IHN0cmluZyk7IHJlZnJlc2goKTsgfSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWRkKG5hbWU6IHN0cmluZywgdmFsdWU6IFZhbHVlKTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXNbbmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXNbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZU9mKCkgPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWZyZXNoKCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSURpc3BhdGNoZXIge1xyXG4gICAgICAgIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN0b3JlIGV4dGVuZHMgVmFsdWUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnksIHByaXZhdGUgZ2xvYmFsczogYW55ID0ge30pIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBzdXBlci5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RhdGlxID0gdGhpcy52YWx1ZS5jb25zdHJ1Y3RvciAmJiB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRpcSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpcS5iaW5kKHRoaXMudmFsdWUuY29uc3RydWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXRpcSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ2xvYmFscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmdsb2JhbHNbaV1bbmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZyAhPT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaCgpIHtcclxuICAgICAgICAgICAgdmFyIHN0YWNrOiB7IHByb3BlcnRpZXMsIHZhbHVlIH1bXSA9IFt0aGlzXTtcclxuICAgICAgICAgICAgdmFyIHN0YWNrTGVuZ3RoID0gMTtcclxuICAgICAgICAgICAgdmFyIGRpcnR5OiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgZGlydHlMZW5ndGg6IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoc3RhY2tMZW5ndGgtLSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc3RhY2tbc3RhY2tMZW5ndGhdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBwYXJlbnQucHJvcGVydGllcztcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VmFsdWUgPSBwYXJlbnQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGk6IG51bWJlciA9IHByb3BlcnRpZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gcHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoYW5nZWQgPSBjaGlsZC5yZWZyZXNoKHBhcmVudFZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tMZW5ndGgrK10gPSBjaGlsZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gY2hpbGQuYWN0aW9ucztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlydHlbZGlydHlMZW5ndGgrK10gPSBhY3Rpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGogPSBkaXJ0eUxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGotLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSBkaXJ0eVtqXTtcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGFjdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGUtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSwgbnVsbCwgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIERlZmF1bHREaXNwYXRjaGVyIHtcclxuICAgICAgICBzdGF0aWMgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElEcml2ZXIge1xyXG4gICAgICAgIGluc2VydChzZW5kZXI6IEJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZGluZyB7XHJcbiAgICAgICAgcHJvdGVjdGVkIGNvbnRleHQ7XHJcbiAgICAgICAgcHJvdGVjdGVkIGRyaXZlcjtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoO1xyXG4gICAgICAgIHByb3RlY3RlZCBleHRlbnNpb25zOiB7IGtleTogYW55LCBleHRlbnNpb246IEV4dGVuc2lvbiB9W107XHJcbiAgICAgICAgcHVibGljIGNoaWxkQmluZGluZ3M6IEJpbmRpbmdbXTtcclxuXHJcbiAgICAgICAgZXhlY3V0ZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jb250ZXh0LCB0aGlzLmRyaXZlcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcjogSURyaXZlcik6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb250ZXh0ICE9PSBjb250ZXh0IHx8IHRoaXMuZHJpdmVyICE9PSBkcml2ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyaXZlciA9IGRyaXZlcjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcihjb250ZXh0LCBkcml2ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb2JzZXJ2ZSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuY2hhbmdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5jaGFuZ2UodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhYnN0cmFjdCByZW5kZXI/KGNvbnRleHQsIGRyaXZlcik6IGFueTtcclxuXHJcbiAgICAgICAgZXh0ZW5kKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyB0aGlzLmV4dGVuc2lvbnMgJiYgaSA8IHRoaXMuZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmV4dGVuc2lvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoeC5rZXkgPT09IGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LmV4dGVuc2lvbi5hZGQobmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID1cclxuICAgICAgICAgICAgICAgIG5ldyBFeHRlbnNpb24odGhpcy5jb250ZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGQobmFtZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmV4dGVuc2lvbnMpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4dGVuc2lvbnMgPSBbeyBrZXksIGV4dGVuc2lvbiB9XTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goeyBrZXksIGV4dGVuc2lvbiB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBleHRlbnNpb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vYnNlcnZlKHNvdXJjZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gbGVuZ3RoLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXh0ID0gdGhpcy5leHRlbmQocGFyYW0sIHNvdXJjZS5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5kKHBhcmFtLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW1iZXIodGFyZ2V0OiB7IGdldChuYW1lOiBzdHJpbmcpIH0sIG5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKHRhcmdldC5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuY2hhbmdlKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmNoYW5nZSh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIHZhciB4cyA9IFtdLCBsZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJnICYmIGFyZy52YWx1ZU9mKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBhcmcudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh4ID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICAgICAgeHMucHVzaCh4KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeHMucHVzaChhcmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcIitcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdICsgeHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdIC0geHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIipcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdICogeHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhc3NpZ25tZW50IGlzIG9ubHkgYWxsb3cgaW4gRXZlbnRCaW5kaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIHhzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0KG9ic2VydmFibGUpIHtcclxuICAgICAgICAgICAgaWYgKCFvYnNlcnZhYmxlLmF3YWl0ZWQpIHtcclxuICAgICAgICAgICAgICAgIG9ic2VydmFibGUuYXdhaXRlZCA9IG5ldyBBd2FpdGVkKG9ic2VydmFibGUudmFsdWVPZigpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlKG9ic2VydmFibGUuYXdhaXRlZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlLmF3YWl0ZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmFsdWF0ZVRleHQocGFydHMpOiBhbnkge1xyXG4gICAgICAgICAgICBpZiAocGFydHMuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IHBhcnRzLmV4ZWN1dGUodGhpcywgdGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcnRzKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrID0gcGFydHMuc2xpY2UoMCkucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IENvcmUuZW1wdHk7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1ciA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXIgPT09IHZvaWQgMCB8fCBjdXIgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCBcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ci5leGVjdXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goY3VyLmV4ZWN1dGUodGhpcywgdGhpcy5jb250ZXh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGN1cikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBjdXIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGN1cltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gY3VyO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlT2JqZWN0KGV4cHIpOiBhbnkge1xyXG4gICAgICAgICAgICBpZiAoIWV4cHIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwcjtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZXhwci5leGVjdXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cHIuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGV4cHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwci5tYXAoeCA9PiB0aGlzLmV2YWx1YXRlT2JqZWN0KHgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFJlYWN0aXZlOyJdfQ==