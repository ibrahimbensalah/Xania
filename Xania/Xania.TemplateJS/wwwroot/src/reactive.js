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
        function Value(dispatcher) {
            this.dispatcher = dispatcher;
            this.properties = [];
            this.extensions = [];
        }
        Value.prototype.get = function (propertyName) {
            for (var i = 0; i < this.properties.length; i++) {
                if (this.properties[i].name === propertyName)
                    return this.properties[i];
            }
            var initialValue = this.value[propertyName];
            if (initialValue === void 0)
                return void 0;
            if (typeof initialValue === "function") {
                return initialValue.bind(this.value);
            }
            var property = new Property(this.dispatcher, this, propertyName);
            property.update();
            this.properties.push(property);
            return property;
        };
        Value.prototype.updateProperties = function () {
            var properties = this.properties.slice(0);
            this.properties = [];
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                if (property.update() || typeof property.value !== "undefined") {
                    this.properties.push(property);
                }
            }
        };
        Value.prototype.extend = function (name, value) {
            for (var i = 0; i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.name === value) {
                    return x.value;
                }
            }
            var scope = new Extension(this.dispatcher, this).add(name, value);
            this.extensions.push({ name: value, value: scope });
            return scope;
        };
        return Value;
    }());
    var Property = (function (_super) {
        __extends(Property, _super);
        function Property(dispatcher, parent, name) {
            var _this = _super.call(this, dispatcher) || this;
            _this.parent = parent;
            _this.name = name;
            _this.actions = [];
            return _this;
        }
        Property.prototype.get = function (name) {
            var result = _super.prototype.get.call(this, name);
            if (typeof result !== "undefined")
                return result;
            return this.parent.get(name);
        };
        Property.prototype.change = function (action) {
            if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        };
        Property.prototype.unbind = function (action) {
            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;
            this.actions.splice(idx, 1);
            return true;
        };
        Property.prototype.set = function (value) {
            if (this.value !== value) {
                this.parent.value[this.name] = value;
                this.update();
            }
        };
        Property.prototype.update = function () {
            var newValue = this.parent.value[this.name];
            if (newValue === this.value)
                return false;
            if (typeof newValue === "undefined")
                throw new Error("Undefined value is not supported");
            this.value = newValue;
            delete this.subscribe;
            if (!!newValue && newValue.subscribe) {
                this.subscribe = newValue.subscribe.bind(newValue);
            }
            if (this.value === void 0) {
                this.extensions = [];
                this.properties = [];
            }
            else {
                this.updateProperties();
            }
            if (this.actions) {
                var actions = this.actions.slice(0);
                for (var i = 0; i < actions.length; i++) {
                    this.dispatcher.dispatch(actions[i]);
                }
            }
            return true;
        };
        Property.prototype.valueOf = function () {
            return this.value;
        };
        Property.prototype.map = function (fn) {
            var _this = this;
            return this.value.map(function (item, idx) { return fn(_super.prototype.get.call(_this, idx), idx); });
        };
        Property.prototype.toString = function () {
            return this.value === null || this.value === void 0 ? "null" : this.value.toString();
        };
        return Property;
    }(Value));
    var Extension = (function () {
        function Extension(dispatcher, parent) {
            this.dispatcher = dispatcher;
            this.parent = parent;
            this.values = {};
        }
        Extension.prototype.add = function (name, value) {
            this.values[name] = value;
            return this;
        };
        Extension.prototype.extend = function (name, value) {
            return new Extension(this.dispatcher, this)
                .add(name, value);
        };
        Extension.prototype.get = function (name) {
            var value = this.values[name];
            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);
                return value;
            }
            return value;
        };
        Extension.prototype.toString = function () {
            return this.values;
        };
        return Extension;
    }());
    Reactive.Extension = Extension;
    var DefaultDispatcher = (function () {
        function DefaultDispatcher() {
        }
        DefaultDispatcher.dispatch = function (action) {
            action.execute();
        };
        return DefaultDispatcher;
    }());
    var Stream = (function (_super) {
        __extends(Stream, _super);
        function Stream(dispatcher, observable) {
            var _this = _super.call(this, dispatcher) || this;
            _this.actions = [];
            _this.value = observable.valueOf();
            _this.subscription = observable.subscribe(_this);
            return _this;
        }
        Stream.prototype.change = function (action) {
            if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        };
        Stream.prototype.unbind = function (action) {
            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;
            this.actions.splice(idx, 1);
            return true;
        };
        Stream.prototype.onNext = function (newValue) {
            if (this.value === newValue)
                return;
            this.value = newValue;
            var actions = this.actions.slice(0);
            for (var i = 0; i < actions.length; i++) {
                this.dispatcher.dispatch(actions[i]);
            }
        };
        Stream.prototype.valueOf = function () {
            return this.value;
        };
        return Stream;
    }(Value));
    var Store = (function (_super) {
        __extends(Store, _super);
        function Store(value, globals, dispatcher) {
            if (globals === void 0) { globals = {}; }
            if (dispatcher === void 0) { dispatcher = DefaultDispatcher; }
            var _this = _super.call(this, dispatcher) || this;
            _this.globals = globals;
            _this.animHandler = 0;
            _this.value = value;
            return _this;
        }
        Store.prototype.get = function (name) {
            var value = _super.prototype.get.call(this, name);
            if (typeof value !== "undefined") {
                return value;
            }
            var statiq = this.value.constructor && this.value.constructor[name];
            if (typeof statiq === "function")
                return statiq.bind(this.value.constructor);
            if (typeof statiq !== "undefined") {
                return statiq;
            }
            for (var i = 0; i < this.globals.length; i++) {
                var g = this.globals[i][name];
                if (typeof g !== "undefined")
                    return g;
            }
            return undefined;
        };
        Store.prototype.toString = function () {
            return JSON.stringify(this.value, null, 4);
        };
        return Store;
    }(Value));
    Reactive.Store = Store;
    var Binding = (function () {
        function Binding(dispatcher) {
            if (dispatcher === void 0) { dispatcher = DefaultDispatcher; }
            this.dispatcher = dispatcher;
            this.dependencies = [];
        }
        Binding.prototype.execute = function () {
            for (var i = 0; i < this.dependencies.length; i++) {
                this.dependencies[i].unbind(this);
            }
            this.dependencies.length = 0;
            this.update(this.context);
        };
        Binding.prototype.update = function (context) {
            var _this = this;
            this.context = context;
            this.state = core_1.Core.ready(this.state, function (s) {
                return _this.render(context, s);
            });
            return this;
        };
        Binding.observe = function (value, observer) {
            if (value) {
                if (value.change) {
                    var dependency = value.change(observer);
                    if (!!dependency)
                        observer.dependencies.push(dependency);
                }
            }
        };
        Binding.prototype.extend = function () {
            throw new Error("Not implemented");
        };
        Binding.prototype.where = function (source, predicate) {
            throw new Error("Not implemented");
        };
        Binding.prototype.select = function (source, selector) {
            return source.map(selector);
        };
        Binding.prototype.query = function (param, source) {
            var _this = this;
            Binding.observe(source, this);
            return source.map(function (item) {
                return _this.context.extend(param, item);
            });
        };
        Binding.prototype.member = function (target, name) {
            var _this = this;
            var value = target.get ? target.get(name) : target[name];
            Binding.observe(value, this);
            if (!!value && !!value.subscribe) {
                var subscription = value.subscribe(function (newValue) {
                    if (newValue !== subscription.current) {
                        subscription.dispose();
                        _this.dispatcher.dispatch(_this);
                    }
                });
                return subscription.current;
            }
            return value;
        };
        Binding.prototype.app = function (fun, args) {
            if (fun === "+") {
                return args[1] + args[0];
            }
            else if (fun === "-") {
                return args[1] - args[0];
            }
            else if (fun === "*") {
                return args[1] * args[0];
            }
            else if (fun === "assign") {
                throw new Error("assignment is only allow in EventBinding");
            }
            return fun.apply(null, args);
        };
        Binding.prototype.const = function (value) {
            return value;
        };
        Binding.prototype.onNext = function (newValue) {
            this.execute();
        };
        Binding.prototype.evaluate = function (accept, parts) {
            var _this = this;
            if (typeof parts === "object" && typeof parts.length === "number") {
                if (parts.length === 0)
                    return "";
                if (parts.length === 1)
                    return this.evaluatePart(accept, parts[0]);
                return parts.map(function (p) { return _this.evaluatePart(accept, p); }).join("");
            }
            else {
                return this.evaluatePart(accept, parts);
            }
        };
        Binding.prototype.evaluatePart = function (accept, part) {
            if (typeof part === "string")
                return part;
            else {
                var value = accept(part, this, this.context);
                return value && value.valueOf();
            }
        };
        return Binding;
    }());
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQThCO0FBRzlCLElBQWMsUUFBUSxDQXFhckI7QUFyYUQsV0FBYyxRQUFRO0lBcUJsQjtRQUtJLGVBQXNCLFVBQXVCO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFKbkMsZUFBVSxHQUFnQixFQUFFLENBQUM7WUFDN0IsZUFBVSxHQUFzQyxFQUFFLENBQUM7UUFJN0QsQ0FBQztRQUVELG1CQUFHLEdBQUgsVUFBSSxZQUFvQjtZQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQztvQkFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUVELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFNUMsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNq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LENBQUM7UUFDTCxjQUFDO0lBQUQsQ0FBQyxBQTlIRCxJQThIQztJQTlIcUIsZ0JBQU8sVUE4SDVCLENBQUE7QUFFTCxDQUFDLEVBcmFhLFFBQVEsR0FBUixnQkFBUSxLQUFSLGdCQUFRLFFBcWFyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCI7XHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSAnLi9vYnNlcnZhYmxlcydcclxuXHJcbmV4cG9ydCBtb2R1bGUgUmVhY3RpdmUge1xyXG5cclxuICAgIGludGVyZmFjZSBJRXhwcmVzc2lvblBhcnNlciB7XHJcbiAgICAgICAgcGFyc2UoZXhwcjogc3RyaW5nKTogeyBleGVjdXRlKHNjb3BlOiB7IGdldChuYW1lOiBzdHJpbmcpIH0pIH07XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElBY3Rpb24ge1xyXG4gICAgICAgIGV4ZWN1dGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURpc3BhdGNoZXIge1xyXG4gICAgICAgIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElQcm9wZXJ0eSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHZhbHVlOiBhbnk7XHJcbiAgICAgICAgdXBkYXRlKCk6IGJvb2xlYW47XHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyB8IG51bWJlcik7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgY2xhc3MgVmFsdWUge1xyXG4gICAgICAgIHByb3RlY3RlZCBwcm9wZXJ0aWVzOiBJUHJvcGVydHlbXSA9IFtdO1xyXG4gICAgICAgIHByb3RlY3RlZCBleHRlbnNpb25zOiB7IG5hbWU6IGFueSwgdmFsdWU6IEV4dGVuc2lvbiB9W10gPSBbXTtcclxuICAgICAgICBwdWJsaWMgdmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlcikge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KHByb3BlcnR5TmFtZTogc3RyaW5nKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXNbaV0ubmFtZSA9PT0gcHJvcGVydHlOYW1lKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsVmFsdWUgPSB0aGlzLnZhbHVlW3Byb3BlcnR5TmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbFZhbHVlID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsVmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluaXRpYWxWYWx1ZS5iaW5kKHRoaXMudmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkodGhpcy5kaXNwYXRjaGVyLCB0aGlzLCBwcm9wZXJ0eU5hbWUpO1xyXG4gICAgICAgICAgICBwcm9wZXJ0eS51cGRhdGUoKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJvdGVjdGVkIHVwZGF0ZVByb3BlcnRpZXMoKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0aWVzLnNsaWNlKDApO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnVwZGF0ZSgpIHx8IHR5cGVvZiBwcm9wZXJ0eS52YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmV4dGVuc2lvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoeC5uYW1lID09PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc2NvcGUgPSBuZXcgRXh0ZW5zaW9uKHRoaXMuZGlzcGF0Y2hlciwgdGhpcykuYWRkKG5hbWUsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucy5wdXNoKHsgbmFtZTogdmFsdWUsIHZhbHVlOiBzY29wZSB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEZXBlbmRlbmN5PFQ+IHtcclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBUKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBQcm9wZXJ0eSBleHRlbmRzIFZhbHVlIGltcGxlbWVudHMgSURlcGVuZGVuY3k8SUFjdGlvbj4ge1xyXG4gICAgICAgIC8vIGxpc3Qgb2Ygb2JzZXJ2ZXJzIHRvIGJlIGRpc3BhdGNoZWQgb24gdmFsdWUgY2hhbmdlXHJcbiAgICAgICAgcHVibGljIGFjdGlvbnM6IElBY3Rpb25bXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyBzdWJzY3JpYmU6ICh2KSA9PiB2b2lkO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlciwgcHJpdmF0ZSBwYXJlbnQ6IHsgdmFsdWU7IGdldChuYW1lOiBzdHJpbmcpIH0sIHB1YmxpYyBuYW1lKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hhbmdlKGFjdGlvbjogSUFjdGlvbik6IElEZXBlbmRlbmN5PElBY3Rpb24+IHwgYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldCh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQudmFsdWVbdGhpcy5uYW1lXSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZSgpIHtcclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5wYXJlbnQudmFsdWVbdGhpcy5uYW1lXTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB0aGlzLnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZCB2YWx1ZSBpcyBub3Qgc3VwcG9ydGVkXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdWJzY3JpYmU7XHJcbiAgICAgICAgICAgIGlmICghIW5ld1ZhbHVlICYmIG5ld1ZhbHVlLnN1YnNjcmliZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUgPSBuZXdWYWx1ZS5zdWJzY3JpYmUuYmluZChuZXdWYWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gW107XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zLnNsaWNlKDApO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmRpc3BhdGNoKGFjdGlvbnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlLm1hcCgoaXRlbSwgaWR4KSA9PiBmbihzdXBlci5nZXQoaWR4KSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPT09IG51bGwgfHwgdGhpcy52YWx1ZSA9PT0gdm9pZCAwID8gXCJudWxsXCIgOiB0aGlzLnZhbHVlLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuICAgICAgICBwcml2YXRlIHZhbHVlcyA9IHt9O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBwcml2YXRlIHBhcmVudD86IHsgZ2V0KG5hbWU6IHN0cmluZyk7IH0pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogVmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHRlbnNpb24odGhpcy5kaXNwYXRjaGVyLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgLmFkZChuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWVzW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBEZWZhdWx0RGlzcGF0Y2hlciB7XHJcbiAgICAgICAgc3RhdGljIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24uZXhlY3V0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBTdHJlYW0gZXh0ZW5kcyBWYWx1ZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBhY3Rpb25zOiBJQWN0aW9uW10gPSBbXTtcclxuICAgICAgICBzdWJzY3JpcHRpb246IE9ic2VydmFibGVzLklTdWJzY3JpcHRpb247XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBvYnNlcnZhYmxlKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gb2JzZXJ2YWJsZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gb2JzZXJ2YWJsZS5zdWJzY3JpYmUodGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3k8SUFjdGlvbj4gfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMucHVzaChhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09PSBuZXdWYWx1ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zLnNsaWNlKDApO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5kaXNwYXRjaChhY3Rpb25zW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdG9yZSBleHRlbmRzIFZhbHVlIHtcclxuICAgICAgICBwcml2YXRlIGFuaW1IYW5kbGVyOiBudW1iZXIgPSAwO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih2YWx1ZTogYW55LCBwcml2YXRlIGdsb2JhbHM6IGFueSA9IHt9LCBkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlciA9IERlZmF1bHREaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1cGVyLmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0YXRpcSA9IHRoaXMudmFsdWUuY29uc3RydWN0b3IgJiYgdGhpcy52YWx1ZS5jb25zdHJ1Y3RvcltuYW1lXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0aXEgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXEuYmluZCh0aGlzLnZhbHVlLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGlxICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ2xvYmFscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmdsb2JhbHNbaV1bbmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGcgIT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUsIG51bGwsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZGluZyB7XHJcblxyXG4gICAgICAgIHB1YmxpYyBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmN5PElBY3Rpb24+W10gPSBbXTtcclxuICAgICAgICBwcm90ZWN0ZWQgY29udGV4dDtcclxuICAgICAgICBwdWJsaWMgc3RhdGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIgPSBEZWZhdWx0RGlzcGF0Y2hlcikgeyB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kZXBlbmRlbmNpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzW2ldLnVuYmluZCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRlcGVuZGVuY2llcy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGUodGhpcy5jb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gQ29yZS5yZWFkeSh0aGlzLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyKGNvbnRleHQsIHMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgb2JzZXJ2ZSh2YWx1ZSwgb2JzZXJ2ZXIpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUuY2hhbmdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlcGVuZGVuY3kgPSB2YWx1ZS5jaGFuZ2Uob2JzZXJ2ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghIWRlcGVuZGVuY3kpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLmRlcGVuZGVuY2llcy5wdXNoKGRlcGVuZGVuY3kpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWJzdHJhY3QgcmVuZGVyKGNvbnRleHQ/LCBzdGF0ZT8pOiBhbnk7XHJcblxyXG4gICAgICAgIGV4dGVuZCgpOiBhbnkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIEJpbmRpbmcub2JzZXJ2ZShzb3VyY2UsIHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChpdGVtID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRleHQuZXh0ZW5kKHBhcmFtLCBpdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW1iZXIodGFyZ2V0OiB7IGdldChuYW1lOiBzdHJpbmcpIH0sIG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmdldCA/IHRhcmdldC5nZXQobmFtZSkgOiB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgICAgIEJpbmRpbmcub2JzZXJ2ZSh2YWx1ZSwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISF2YWx1ZSAmJiAhIXZhbHVlLnN1YnNjcmliZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdW53cmFwIGN1cnJlbnQgdmFsdWUgb2Ygb2JzZXJ2YWJsZVxyXG4gICAgICAgICAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IHZhbHVlLnN1YnNjcmliZShuZXdWYWx1ZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBzdWJzY3JpcHRpb24uY3VycmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2godGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbi5jdXJyZW50O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgaWYgKGZ1biA9PT0gXCIrXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmdzWzFdICsgYXJnc1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1sxXSAtIGFyZ3NbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIipcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMV0gKiBhcmdzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZ1biA9PT0gXCJhc3NpZ25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXNzaWdubWVudCBpcyBvbmx5IGFsbG93IGluIEV2ZW50QmluZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgIC8vdmFyIHZhbHVlID0gYXJnc1swXS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAvL2FyZ3NbMV0uc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGUoYWNjZXB0LCBwYXJ0cyk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHBhcnRzLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChhY2NlcHQsIHBhcnRzWzBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydHMubWFwKHAgPT4gdGhpcy5ldmFsdWF0ZVBhcnQoYWNjZXB0LCBwKSkuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChhY2NlcHQsIHBhcnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGVQYXJ0KGFjY2VwdCwgcGFydDogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0O1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2VwdChwYXJ0LCB0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iXX0=