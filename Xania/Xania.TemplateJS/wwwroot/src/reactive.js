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
            throw new Error("Cannot resolve variable " + name);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQThCO0FBRzlCLElBQWMsUUFBUSxDQWdhckI7QUFoYUQsV0FBYyxRQUFRO0lBcUJsQjtRQUtJLGVBQXNCLFVBQXVCO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFKbkMsZUFBVSxHQUFnQixFQUFFLENBQUM7WUFDN0IsZUFBVSxHQUFzQyxFQUFFLENBQUM7UUFJN0QsQ0FBQztRQUVELG1CQUFHLEdBQUgsVUFBSSxZQUFvQjtZQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQztvQkFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUVELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFNUMsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNq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LGdCQUFRLEtBQVIsZ0JBQVEsUUFnYXJCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuL2NvcmVcIjtcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tICcuL29ic2VydmFibGVzJ1xyXG5cclxuZXhwb3J0IG1vZHVsZSBSZWFjdGl2ZSB7XHJcblxyXG4gICAgaW50ZXJmYWNlIElFeHByZXNzaW9uUGFyc2VyIHtcclxuICAgICAgICBwYXJzZShleHByOiBzdHJpbmcpOiB7IGV4ZWN1dGUoc2NvcGU6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSkgfTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSUFjdGlvbiB7XHJcbiAgICAgICAgZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVByb3BlcnR5IHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmFsdWU6IGFueTtcclxuICAgICAgICB1cGRhdGUoKTogYm9vbGVhbjtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHJvdGVjdGVkIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdID0gW107XHJcbiAgICAgICAgcHJvdGVjdGVkIGV4dGVuc2lvbnM6IHsgbmFtZTogYW55LCB2YWx1ZTogRXh0ZW5zaW9uIH1bXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyB2YWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJvdGVjdGVkIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBJUHJvcGVydHkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1tpXS5uYW1lID09PSBwcm9wZXJ0eU5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxWYWx1ZSA9IHRoaXMudmFsdWVbcHJvcGVydHlOYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsVmFsdWUgPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5pdGlhbFZhbHVlLmJpbmQodGhpcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSh0aGlzLmRpc3BhdGNoZXIsIHRoaXMsIHByb3BlcnR5TmFtZSk7XHJcbiAgICAgICAgICAgIHByb3BlcnR5LnVwZGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMucHVzaChwcm9wZXJ0eSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcm90ZWN0ZWQgdXBkYXRlUHJvcGVydGllcygpIHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkudXBkYXRlKCkgfHwgdHlwZW9mIHByb3BlcnR5LnZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5leHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZXh0ZW5zaW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICh4Lm5hbWUgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzY29wZSA9IG5ldyBFeHRlbnNpb24odGhpcy5kaXNwYXRjaGVyLCB0aGlzKS5hZGQobmFtZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goeyBuYW1lOiB2YWx1ZSwgdmFsdWU6IHNjb3BlIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURlcGVuZGVuY3k8VD4ge1xyXG4gICAgICAgIHVuYmluZChhY3Rpb246IFQpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFByb3BlcnR5IGV4dGVuZHMgVmFsdWUgaW1wbGVtZW50cyBJRGVwZW5kZW5jeTxJQWN0aW9uPiB7XHJcbiAgICAgICAgLy8gbGlzdCBvZiBvYnNlcnZlcnMgdG8gYmUgZGlzcGF0Y2hlZCBvbiB2YWx1ZSBjaGFuZ2VcclxuICAgICAgICBwdWJsaWMgYWN0aW9uczogSUFjdGlvbltdID0gW107XHJcbiAgICAgICAgcHVibGljIHN1YnNjcmliZTogKHYpID0+IHZvaWQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBwcml2YXRlIHBhcmVudDogeyB2YWx1ZTsgZ2V0KG5hbWU6IHN0cmluZykgfSwgcHVibGljIG5hbWUpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzdXBlci5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3k8SUFjdGlvbj4gfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMucHVzaChhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHRoaXMudmFsdWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5kZWZpbmVkIHZhbHVlIGlzIG5vdCBzdXBwb3J0ZWRcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN1YnNjcmliZTtcclxuICAgICAgICAgICAgaWYgKCEhbmV3VmFsdWUgJiYgbmV3VmFsdWUuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmliZSA9IG5ld1ZhbHVlLnN1YnNjcmliZS5iaW5kKG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAoZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUubWFwKChpdGVtLCBpZHgpID0+IGZuKHN1cGVyLmdldChpZHgpLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA9PT0gbnVsbCB8fCB0aGlzLnZhbHVlID09PSB2b2lkIDAgPyBcIm51bGxcIiA6IHRoaXMudmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV4dGVuc2lvbiB7XHJcblxyXG4gICAgICAgIHByaXZhdGUgdmFsdWVzID0ge307XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIsIHByaXZhdGUgcGFyZW50PzogeyBnZXQobmFtZTogc3RyaW5nKTsgfSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWRkKG5hbWU6IHN0cmluZywgdmFsdWU6IFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4dGVuc2lvbih0aGlzLmRpc3BhdGNoZXIsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAuYWRkKG5hbWUsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZXNbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIERlZmF1bHREaXNwYXRjaGVyIHtcclxuICAgICAgICBzdGF0aWMgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFN0cmVhbSBleHRlbmRzIFZhbHVlIHtcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXSA9IFtdO1xyXG4gICAgICAgIHN1YnNjcmlwdGlvbjogT2JzZXJ2YWJsZXMuSVN1YnNjcmlwdGlvbjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIsIG9ic2VydmFibGUpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBvYnNlcnZhYmxlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24gPSBvYnNlcnZhYmxlLnN1YnNjcmliZSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb246IElBY3Rpb24pOiBJRGVwZW5kZW5jeTxJQWN0aW9uPiB8IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQobmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT09IG5ld1ZhbHVlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG5ld1ZhbHVlO1xyXG5cclxuICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmRpc3BhdGNoKGFjdGlvbnNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN0b3JlIGV4dGVuZHMgVmFsdWUge1xyXG4gICAgICAgIHByaXZhdGUgYW5pbUhhbmRsZXI6IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnksIHByaXZhdGUgZ2xvYmFsczogYW55ID0ge30sIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyID0gRGVmYXVsdERpc3BhdGNoZXIpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RhdGlxID0gdGhpcy52YWx1ZS5jb25zdHJ1Y3RvciAmJiB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRpcSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpcS5iaW5kKHRoaXMudmFsdWUuY29uc3RydWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0aXEgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5nbG9iYWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZyA9IHRoaXMuZ2xvYmFsc1tpXVtuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZyAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlc29sdmUgdmFyaWFibGUgXCIgKyBuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSwgbnVsbCwgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCaW5kaW5nIHtcclxuXHJcbiAgICAgICAgcHVibGljIGRlcGVuZGVuY2llczogSURlcGVuZGVuY3k8SUFjdGlvbj5bXSA9IFtdO1xyXG4gICAgICAgIHByb3RlY3RlZCBjb250ZXh0O1xyXG4gICAgICAgIHB1YmxpYyBzdGF0ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlciA9IERlZmF1bHREaXNwYXRjaGVyKSB7IH1cclxuXHJcbiAgICAgICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlcGVuZGVuY2llcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXBlbmRlbmNpZXNbaV0udW5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSh0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBDb3JlLnJlYWR5KHRoaXMuc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXIoY29udGV4dCwgcyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBvYnNlcnZlKHZhbHVlLCBvYnNlcnZlcikge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5jaGFuZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGVwZW5kZW5jeSA9IHZhbHVlLmNoYW5nZShvYnNlcnZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhZGVwZW5kZW5jeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZGVwZW5kZW5jaWVzLnB1c2goZGVwZW5kZW5jeSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhYnN0cmFjdCByZW5kZXIoY29udGV4dD8sIHN0YXRlPyk6IGFueTtcclxuXHJcbiAgICAgICAgZXh0ZW5kKCk6IGFueSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoZXJlKHNvdXJjZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdChzb3VyY2UsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHF1ZXJ5KHBhcmFtLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgQmluZGluZy5vYnNlcnZlKHNvdXJjZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5leHRlbmQocGFyYW0sIGl0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXQuZ2V0ID8gdGFyZ2V0LmdldChuYW1lKSA6IHRhcmdldFtuYW1lXTtcclxuICAgICAgICAgICAgQmluZGluZy5vYnNlcnZlKHZhbHVlLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXZhbHVlICYmICEhdmFsdWUuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB1bndyYXAgY3VycmVudCB2YWx1ZSBvZiBvYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gdmFsdWUuc3Vic2NyaWJlKG5ld1ZhbHVlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHN1YnNjcmlwdGlvbi5jdXJyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5kaXNwYXRjaCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcIitcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMV0gKyBhcmdzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZ1biA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmdzWzFdIC0gYXJnc1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1sxXSAqIGFyZ3NbMF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQobmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmFsdWF0ZShhY2NlcHQsIHBhcnRzKTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJ0cyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcGFydHMubGVuZ3RoID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXZhbHVhdGVQYXJ0KGFjY2VwdCwgcGFydHNbMF0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0cy5tYXAocCA9PiB0aGlzLmV2YWx1YXRlUGFydChhY2NlcHQsIHApKS5qb2luKFwiXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXZhbHVhdGVQYXJ0KGFjY2VwdCwgcGFydHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmFsdWF0ZVBhcnQoYWNjZXB0LCBwYXJ0OiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnQ7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXB0KHBhcnQsIHRoaXMsIHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgJiYgdmFsdWUudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSJdfQ==