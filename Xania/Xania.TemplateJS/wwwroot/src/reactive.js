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
        function Value(value, dispatcher) {
            this.value = value;
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
            var property = new Property(this.dispatcher, this, propertyName, initialValue);
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
        function Property(dispatcher, parent, name, value) {
            var _this = _super.call(this, value, dispatcher) || this;
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
            this.value = newValue;
            var actions = this.actions.slice(0);
            for (var i = 0; i < actions.length; i++) {
                this.dispatcher.dispatch(actions[i]);
            }
            if (this.value === void 0) {
                this.extensions = [];
                this.properties = [];
            }
            else {
                _super.prototype.updateProperties.call(this);
            }
            return this.value;
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
    var Store = (function (_super) {
        __extends(Store, _super);
        function Store(value, globals) {
            if (globals === void 0) { globals = {}; }
            var _this = _super.call(this, value, null) || this;
            _this.globals = globals;
            _this.dirty = [];
            _this.dispatcher = _this;
            return _this;
        }
        Store.prototype.dispatch = function (action) {
            this.dirty.push(action);
        };
        Store.prototype.flush = function () {
            this.dirty.forEach(function (d) {
                d.execute();
            });
            this.dirty.length = 0;
        };
        Store.prototype.get = function (name) {
            var value = _super.prototype.get.call(this, name);
            if (typeof value !== "undefined") {
                return value;
            }
            var statiq = this.value.constructor && this.value.constructor[name];
            if (typeof statiq !== "undefined")
                return statiq;
            for (var i = 0; i < this.globals.length; i++) {
                var g = this.globals[i][name];
                if (typeof g !== "undefined")
                    return g;
            }
            throw new Error("Cannot resolve variable " + name);
        };
        Store.prototype.toString = function () {
            return JSON.stringify(this.value, null, 4);
        };
        return Store;
    }(Value));
    Reactive.Store = Store;
    var Binding = (function () {
        function Binding() {
            this.dependencies = [];
            this.subscriptions = [];
        }
        Binding.prototype.execute = function () {
            for (var i = 0; i < this.dependencies.length; i++) {
                this.dependencies[i].unbind(this);
            }
            this.dependencies.length = 0;
            for (var e = 0; e < this.subscriptions.length; e++) {
                this.subscriptions[e].dispose();
            }
            this.subscriptions.length = 0;
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
            if (value && value.change) {
                var dependency = value.change(observer);
                if (!!dependency)
                    observer.dependencies.push(dependency);
            }
        };
        Binding.prototype.get = function (name) {
            throw new Error("Not implemented");
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
            var value = target.get(name);
            Binding.observe(value, this);
            return value;
        };
        Binding.prototype.app = function (fun, args) {
            if (fun === "+") {
                return args[1] + args[0];
            }
            return fun.apply(null, args);
        };
        Binding.prototype.const = function (value) {
            return value;
        };
        Binding.prototype.evaluate = function (parts, accept, context) {
            var _this = this;
            if (typeof parts === "object" && typeof parts.length === "number") {
                if (parts.length === 0)
                    return "";
                if (parts.length === 1)
                    return this.evaluatePart(parts[0], accept, context);
                return parts.map(function (p) { return _this.evaluatePart(p, accept, context).valueOf(); }).join("");
            }
            else {
                return this.evaluatePart(parts, accept, context);
            }
        };
        Binding.prototype.evaluatePart = function (part, accept, context) {
            if (typeof part === "string")
                return part;
            else {
                var result = accept(part, this, context);
                if (!!result && result.subscribe) {
                    debugger;
                    this.subscriptions.push(result.subscribe(this));
                }
                return result.valueOf();
            }
        };
        return Binding;
    }());
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQThCO0FBRzlCLElBQWMsUUFBUSxDQWtXckI7QUFsV0QsV0FBYyxRQUFRO0lBcUJsQjtRQUlJLGVBQW1CLEtBQUssRUFBWSxVQUF1QjtZQUF4QyxVQUFLLEdBQUwsS0FBSyxDQUFBO1lBQVksZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUhqRCxlQUFVLEdBQWdCLEVBQUUsQ0FBQztZQUM3QixlQUFVLEdBQXNDLEVBQUUsQ0FBQztRQUc3RCxDQUFDO1FBRUQsbUJBQUcsR0FBSCxVQUFJLFlBQW9CO1lBQ3BCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDO29CQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUU1QyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsQixFQUFFLENBQUMsQ0FBQyxPQUFPLFlBQVksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFV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bXBvcnQgeyBDb3JlIH0gZnJvbSBcIi4vY29yZVwiO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gJy4vb2JzZXJ2YWJsZXMnXHJcblxyXG5leHBvcnQgbW9kdWxlIFJlYWN0aXZlIHtcclxuXHJcbiAgICBpbnRlcmZhY2UgSUV4cHJlc3Npb25QYXJzZXIge1xyXG4gICAgICAgIHBhcnNlKGV4cHI6IHN0cmluZyk6IHsgZXhlY3V0ZShzY29wZTogeyBnZXQobmFtZTogc3RyaW5nKSB9KSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBkaXNwYXRjaChhY3Rpb246IElBY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJUHJvcGVydHkge1xyXG4gICAgICAgIG5hbWU6IHN0cmluZztcclxuICAgICAgICB2YWx1ZTogYW55O1xyXG4gICAgICAgIHVwZGF0ZSgpOiBib29sZWFuO1xyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcgfCBudW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNsYXNzIFZhbHVlIHtcclxuICAgICAgICBwcm90ZWN0ZWQgcHJvcGVydGllczogSVByb3BlcnR5W10gPSBbXTtcclxuICAgICAgICBwcm90ZWN0ZWQgZXh0ZW5zaW9uczogeyBuYW1lOiBhbnksIHZhbHVlOiBFeHRlbnNpb24gfVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZSwgcHJvdGVjdGVkIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBJUHJvcGVydHkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1tpXS5uYW1lID09PSBwcm9wZXJ0eU5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxWYWx1ZSA9IHRoaXMudmFsdWVbcHJvcGVydHlOYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsVmFsdWUgPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5pdGlhbFZhbHVlLmJpbmQodGhpcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSh0aGlzLmRpc3BhdGNoZXIsIHRoaXMsIHByb3BlcnR5TmFtZSwgaW5pdGlhbFZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJvdGVjdGVkIHVwZGF0ZVByb3BlcnRpZXMoKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0aWVzLnNsaWNlKDApO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnVwZGF0ZSgpIHx8IHR5cGVvZiBwcm9wZXJ0eS52YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmV4dGVuc2lvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoeC5uYW1lID09PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc2NvcGUgPSBuZXcgRXh0ZW5zaW9uKHRoaXMuZGlzcGF0Y2hlciwgdGhpcykuYWRkKG5hbWUsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucy5wdXNoKHsgbmFtZTogdmFsdWUsIHZhbHVlOiBzY29wZSB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEZXBlbmRlbmN5PFQ+IHtcclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBUKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBQcm9wZXJ0eSBleHRlbmRzIFZhbHVlIGltcGxlbWVudHMgSURlcGVuZGVuY3k8SUFjdGlvbj4ge1xyXG4gICAgICAgIC8vIGxpc3Qgb2Ygb2JzZXJ2ZXJzIHRvIGJlIGRpc3BhdGNoZWQgb24gdmFsdWUgY2hhbmdlXHJcbiAgICAgICAgcHVibGljIGFjdGlvbnM6IElBY3Rpb25bXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlciwgcHJpdmF0ZSBwYXJlbnQ6IHsgdmFsdWU7IGdldChuYW1lOiBzdHJpbmcpIH0sIHB1YmxpYyBuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBzdXBlcih2YWx1ZSwgZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzdXBlci5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3k8SUFjdGlvbj4gfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMucHVzaChhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHRoaXMudmFsdWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcblxyXG4gICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gW107XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdXBlci51cGRhdGVQcm9wZXJ0aWVzKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAoZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUubWFwKChpdGVtLCBpZHgpID0+IGZuKHN1cGVyLmdldChpZHgpLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA9PT0gbnVsbCB8fCB0aGlzLnZhbHVlID09PSB2b2lkIDAgPyBcIm51bGxcIiA6IHRoaXMudmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV4dGVuc2lvbiB7XHJcblxyXG4gICAgICAgIHByaXZhdGUgdmFsdWVzID0ge307XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIsIHByaXZhdGUgcGFyZW50PzogeyBnZXQobmFtZTogc3RyaW5nKTsgfSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWRkKG5hbWU6IHN0cmluZywgdmFsdWU6IFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4dGVuc2lvbih0aGlzLmRpc3BhdGNoZXIsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAuYWRkKG5hbWUsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZXNbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdG9yZSBleHRlbmRzIFZhbHVlIGltcGxlbWVudHMgSURpc3BhdGNoZXIge1xyXG4gICAgICAgIHB1YmxpYyBkaXJ0eSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih2YWx1ZTogYW55LCBwcml2YXRlIGdsb2JhbHM6IGFueSA9IHt9KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKHZhbHVlLCBudWxsKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyID0gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goYWN0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZsdXNoKCkge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5LmZvckVhY2goZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBkLmV4ZWN1dGUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RhdGlxID0gdGhpcy52YWx1ZS5jb25zdHJ1Y3RvciAmJiB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRpcSAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXE7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ2xvYmFscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmdsb2JhbHNbaV1bbmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGcgIT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZXNvbHZlIHZhcmlhYmxlIFwiICsgbmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUsIG51bGwsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZGluZyB7XHJcblxyXG4gICAgICAgIHB1YmxpYyBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmN5PElBY3Rpb24+W10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIHN1YnNjcmlwdGlvbnM6IE9ic2VydmFibGVzLklTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG4gICAgICAgIHByb3RlY3RlZCBjb250ZXh0O1xyXG4gICAgICAgIHB1YmxpYyBzdGF0ZTtcclxuXHJcbiAgICAgICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlcGVuZGVuY2llcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXBlbmRlbmNpZXNbaV0udW5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMuc3Vic2NyaXB0aW9ucy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zW2VdLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IENvcmUucmVhZHkodGhpcy5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbmRlcihjb250ZXh0LCBzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIG9ic2VydmUodmFsdWUsIG9ic2VydmVyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkZXBlbmRlbmN5ID0gdmFsdWUuY2hhbmdlKG9ic2VydmVyKTtcclxuICAgICAgICAgICAgICAgIGlmICghIWRlcGVuZGVuY3kpXHJcbiAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZGVwZW5kZW5jaWVzLnB1c2goZGVwZW5kZW5jeSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhYnN0cmFjdCByZW5kZXIoY29udGV4dD8sIHN0YXRlPykgOiBhbnk7XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQoKTogYW55IHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcXVlcnkocGFyYW0sIHNvdXJjZSkge1xyXG4gICAgICAgICAgICBCaW5kaW5nLm9ic2VydmUoc291cmNlLCB0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmV4dGVuZChwYXJhbSwgaXRlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWVtYmVyKHRhcmdldDogeyBnZXQobmFtZTogc3RyaW5nKSB9LCBuYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICBCaW5kaW5nLm9ic2VydmUodmFsdWUsIHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiK1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1sxXSArIGFyZ3NbMF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgZXZhbHVhdGUocGFydHMsIGFjY2VwdCwgY29udGV4dCk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHBhcnRzLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChwYXJ0c1swXSwgYWNjZXB0LCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydHMubWFwKHAgPT4gdGhpcy5ldmFsdWF0ZVBhcnQocCwgYWNjZXB0LCBjb250ZXh0KS52YWx1ZU9mKCkpLmpvaW4oXCJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ldmFsdWF0ZVBhcnQocGFydHMsIGFjY2VwdCwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlUGFydChwYXJ0OiBhbnksIGFjY2VwdCwgY29udGV4dCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcnQgPT09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydDtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhY2NlcHQocGFydCwgdGhpcywgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEhcmVzdWx0ICYmIHJlc3VsdC5zdWJzY3JpYmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2dlcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChyZXN1bHQuc3Vic2NyaWJlKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iXX0=