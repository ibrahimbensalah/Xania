"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
            this.extensions = [];
        }
        Extension.prototype.add = function (name, value) {
            this.values[name] = value;
            return this;
        };
        Extension.prototype.extend = function (name, value) {
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
        Binding.prototype.execute = function (options) {
            for (var i = 0; i < this.dependencies.length; i++) {
                this.dependencies[i].unbind(this);
            }
            this.dependencies.length = 0;
            this.update(this.context, options);
        };
        Binding.prototype.update = function (context, options) {
            this.context = context;
            this.render(context, options);
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
            return fun.apply(null, args.map(function (x) { return x.valueOf(); }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBR0EsSUFBYyxRQUFRLENBMmFyQjtBQTNhRCxXQUFjLFFBQVE7SUFxQmxCO1FBS0ksZUFBc0IsVUFBdUI7WUFBdkIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUpuQyxlQUFVLEdBQWdCLEVBQUUsQ0FBQztZQUM3QixlQUFVLEdBQXNDLEVBQUUsQ0FBQztRQUk3RCxDQUFDO1FBRUQsbUJBQUcsR0FBSCxVQUFJLFlBQW9CO1lBQ3BCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDO29CQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUU1QyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsQixFQUFFLENBQUMsQ0FBQyxPQUFPLFlBQVksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pFLFFBQVEsQ0FBQyxN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QUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDTCxDQUFDO1FBRUQsOEJBQVksR0FBWixVQUFhLE1BQU0sRUFBRSxJQUFTO1lBQzFCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQztnQkFDekIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNoQixJQUFJLENBQUMsQ0FBQztnQkFDRixJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BDLENBQUM7UUFDTCxDQUFDO1FBQ0wsY0FBQztJQUFELENBQUMsQUF6SEQsSUF5SEM7SUF6SHFCLGdCQUFPLFVBeUg1QixDQUFBO0FBRUwsQ0FBQyxFQTNhYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQTJhckIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSBcIi4vY29yZVwiO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gJy4vb2JzZXJ2YWJsZXMnXHJcblxyXG5leHBvcnQgbW9kdWxlIFJlYWN0aXZlIHtcclxuXHJcbiAgICBpbnRlcmZhY2UgSUV4cHJlc3Npb25QYXJzZXIge1xyXG4gICAgICAgIHBhcnNlKGV4cHI6IHN0cmluZyk6IHsgZXhlY3V0ZShzY29wZTogeyBnZXQobmFtZTogc3RyaW5nKSB9KSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKG9wdGlvbnM/OiBhbnkpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVByb3BlcnR5IHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmFsdWU6IGFueTtcclxuICAgICAgICB1cGRhdGUoKTogYm9vbGVhbjtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHJvdGVjdGVkIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdID0gW107XHJcbiAgICAgICAgcHJvdGVjdGVkIGV4dGVuc2lvbnM6IHsgbmFtZTogYW55LCB2YWx1ZTogRXh0ZW5zaW9uIH1bXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyB2YWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJvdGVjdGVkIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBJUHJvcGVydHkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1tpXS5uYW1lID09PSBwcm9wZXJ0eU5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxWYWx1ZSA9IHRoaXMudmFsdWVbcHJvcGVydHlOYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsVmFsdWUgPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5pdGlhbFZhbHVlLmJpbmQodGhpcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSh0aGlzLmRpc3BhdGNoZXIsIHRoaXMsIHByb3BlcnR5TmFtZSk7XHJcbiAgICAgICAgICAgIHByb3BlcnR5LnVwZGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMucHVzaChwcm9wZXJ0eSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcm90ZWN0ZWQgdXBkYXRlUHJvcGVydGllcygpIHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkudXBkYXRlKCkgfHwgdHlwZW9mIHByb3BlcnR5LnZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5leHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZXh0ZW5zaW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICh4Lm5hbWUgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzY29wZSA9IG5ldyBFeHRlbnNpb24odGhpcy5kaXNwYXRjaGVyLCB0aGlzKS5hZGQobmFtZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goeyBuYW1lOiB2YWx1ZSwgdmFsdWU6IHNjb3BlIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURlcGVuZGVuY3k8VD4ge1xyXG4gICAgICAgIHVuYmluZChhY3Rpb246IFQpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFByb3BlcnR5IGV4dGVuZHMgVmFsdWUgaW1wbGVtZW50cyBJRGVwZW5kZW5jeTxJQWN0aW9uPiB7XHJcbiAgICAgICAgLy8gbGlzdCBvZiBvYnNlcnZlcnMgdG8gYmUgZGlzcGF0Y2hlZCBvbiB2YWx1ZSBjaGFuZ2VcclxuICAgICAgICBwdWJsaWMgYWN0aW9uczogSUFjdGlvbltdID0gW107XHJcbiAgICAgICAgcHVibGljIHN1YnNjcmliZTogKHYpID0+IHZvaWQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBwcml2YXRlIHBhcmVudDogeyB2YWx1ZTsgZ2V0KG5hbWU6IHN0cmluZykgfSwgcHVibGljIG5hbWUpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBzdXBlci5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3k8SUFjdGlvbj4gfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbnMucHVzaChhY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHRoaXMudmFsdWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5kZWZpbmVkIHZhbHVlIGlzIG5vdCBzdXBwb3J0ZWRcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN1YnNjcmliZTtcclxuICAgICAgICAgICAgaWYgKCEhbmV3VmFsdWUgJiYgbmV3VmFsdWUuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmliZSA9IG5ld1ZhbHVlLnN1YnNjcmliZS5iaW5kKG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAoZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUubWFwKChpdGVtLCBpZHgpID0+IGZuKHN1cGVyLmdldChpZHgpLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA9PT0gbnVsbCB8fCB0aGlzLnZhbHVlID09PSB2b2lkIDAgPyBcIm51bGxcIiA6IHRoaXMudmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV4dGVuc2lvbiB7XHJcblxyXG4gICAgICAgIHByaXZhdGUgdmFsdWVzID0ge307XHJcbiAgICAgICAgcHJvdGVjdGVkIGV4dGVuc2lvbnM6IHsgbmFtZTogYW55LCB2YWx1ZTogRXh0ZW5zaW9uIH1bXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBwcml2YXRlIHBhcmVudD86IHsgZ2V0KG5hbWU6IHN0cmluZyk7IH0pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5leHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZXh0ZW5zaW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICh4Lm5hbWUgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzY29wZSA9IG5ldyBFeHRlbnNpb24odGhpcy5kaXNwYXRjaGVyLCB0aGlzKS5hZGQobmFtZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goeyBuYW1lOiB2YWx1ZSwgdmFsdWU6IHNjb3BlIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlc1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgRGVmYXVsdERpc3BhdGNoZXIge1xyXG4gICAgICAgIHN0YXRpYyBkaXNwYXRjaChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgYWN0aW9uLmV4ZWN1dGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgU3RyZWFtIGV4dGVuZHMgVmFsdWUge1xyXG4gICAgICAgIHByaXZhdGUgYWN0aW9uczogSUFjdGlvbltdID0gW107XHJcbiAgICAgICAgc3Vic2NyaXB0aW9uOiBPYnNlcnZhYmxlcy5JU3Vic2NyaXB0aW9uO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlciwgb2JzZXJ2YWJsZSkge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG9ic2VydmFibGUudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IG9ic2VydmFibGUuc3Vic2NyaWJlKHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hhbmdlKGFjdGlvbjogSUFjdGlvbik6IElEZXBlbmRlbmN5PElBY3Rpb24+IHwgYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PT0gbmV3VmFsdWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcblxyXG4gICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3RvcmUgZXh0ZW5kcyBWYWx1ZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBhbmltSGFuZGxlcjogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IodmFsdWU6IGFueSwgcHJpdmF0ZSBnbG9iYWxzOiBhbnkgPSB7fSwgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIgPSBEZWZhdWx0RGlzcGF0Y2hlcikge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBzdXBlci5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzdGF0aXEgPSB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yICYmIHRoaXMudmFsdWUuY29uc3RydWN0b3JbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGlxID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxLmJpbmQodGhpcy52YWx1ZS5jb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRpcSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpcTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdsb2JhbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBnID0gdGhpcy5nbG9iYWxzW2ldW25hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnZhbHVlLCBudWxsLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJpbmRpbmcge1xyXG5cclxuICAgICAgICBwdWJsaWMgZGVwZW5kZW5jaWVzOiBJRGVwZW5kZW5jeTxJQWN0aW9uPltdID0gW107XHJcbiAgICAgICAgcHJvdGVjdGVkIGNvbnRleHQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIgPSBEZWZhdWx0RGlzcGF0Y2hlcikgeyB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUob3B0aW9ucz86IGFueSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGVwZW5kZW5jaWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlcGVuZGVuY2llc1tpXS51bmJpbmQodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kZXBlbmRlbmNpZXMubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKHRoaXMuY29udGV4dCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCwgb3B0aW9ucz8pIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKGNvbnRleHQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgb2JzZXJ2ZSh2YWx1ZSwgb2JzZXJ2ZXIpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUuY2hhbmdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlcGVuZGVuY3kgPSB2YWx1ZS5jaGFuZ2Uob2JzZXJ2ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghIWRlcGVuZGVuY3kpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLmRlcGVuZGVuY2llcy5wdXNoKGRlcGVuZGVuY3kpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWJzdHJhY3QgcmVuZGVyKGNvbnRleHQ/LCBvcHRpb25zPyk6IGFueTtcclxuXHJcbiAgICAgICAgZXh0ZW5kKCk6IGFueSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoZXJlKHNvdXJjZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdChzb3VyY2UsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHF1ZXJ5KHBhcmFtLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgQmluZGluZy5vYnNlcnZlKHNvdXJjZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5leHRlbmQocGFyYW0sIGl0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXQuZ2V0ID8gdGFyZ2V0LmdldChuYW1lKSA6IHRhcmdldFtuYW1lXTtcclxuICAgICAgICAgICAgQmluZGluZy5vYnNlcnZlKHZhbHVlLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXZhbHVlICYmICEhdmFsdWUuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB1bndyYXAgY3VycmVudCB2YWx1ZSBvZiBvYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gdmFsdWUuc3Vic2NyaWJlKG5ld1ZhbHVlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHN1YnNjcmlwdGlvbi5jdXJyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5kaXNwYXRjaCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcIitcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMV0gKyBhcmdzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZ1biA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmdzWzFdIC0gYXJnc1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmdW4gPT09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1sxXSAqIGFyZ3NbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhc3NpZ25tZW50IGlzIG9ubHkgYWxsb3cgaW4gRXZlbnRCaW5kaW5nXCIpO1xyXG4gICAgICAgICAgICAgICAgLy92YXIgdmFsdWUgPSBhcmdzWzBdLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIC8vYXJnc1sxXS5zZXQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncy5tYXAoeCA9PiB4LnZhbHVlT2YoKSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGUoYWNjZXB0LCBwYXJ0cyk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHBhcnRzLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChhY2NlcHQsIHBhcnRzWzBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydHMubWFwKHAgPT4gdGhpcy5ldmFsdWF0ZVBhcnQoYWNjZXB0LCBwKSkuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChhY2NlcHQsIHBhcnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGVQYXJ0KGFjY2VwdCwgcGFydDogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0O1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2VwdChwYXJ0LCB0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iXX0=