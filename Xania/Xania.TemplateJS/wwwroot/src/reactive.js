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
        Value.prototype.refresh = function () {
            if (!this.properties)
                return;
            var disposed = [];
            for (var i = 0; i < this.properties.length; i++) {
                var property = this.properties[i];
                property.update(this.value);
                if (property.valueOf() === void 0) {
                    disposed.push(i);
                }
            }
            for (var i = disposed.length - 1; i >= 0; i--) {
                this.properties.splice(disposed[i], 1);
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
            if (this.value !== value) {
                this.parent.value[this.name] = value;
                this.update(this.parent.value);
                this.refresh();
            }
        };
        Property.prototype.update = function (parentValue) {
            var name = this.name, newValue = parentValue[name];
            if (newValue !== this.value) {
                this[name] = newValue;
                this.value = newValue;
                if (this.awaited) {
                    this.awaited.dispose();
                    delete this.awaited;
                }
                var actions = this.actions;
                if (actions && actions.length) {
                    var i = actions.length - 1;
                    do {
                        actions[i].notify(this);
                    } while (i--);
                }
            }
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
                        actions[i].notify(this);
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
        Store.prototype.update = function () {
            var stack = [this];
            while (stack.length > 0) {
                var p = stack.pop();
                if (p.properties) {
                    var properties = p.properties;
                    var length = properties.length;
                    var value = p.value;
                    for (var i = 0; i < length; i++) {
                        var child = properties[i];
                        child.update(value);
                        stack.push(child);
                    }
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
        function Binding(dispatcher) {
            if (dispatcher === void 0) { dispatcher = DefaultDispatcher; }
            this.dispatcher = dispatcher;
        }
        Binding.prototype.execute = function () {
            this.render(this.context);
        };
        Binding.prototype.notify = function (v) {
            v.unbind(this);
            this.dispatcher.dispatch(this);
        };
        Binding.prototype.update = function (context) {
            if (this.context !== context) {
                this.context = context;
                this.execute();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQThCO0FBRzlCLElBQWMsUUFBUSxDQStkckI7QUEvZEQsV0FBYyxRQUFRO0lBa0JsQjtRQUFBO1FBeURBLENBQUM7UUFyREcsbUJBQUcsR0FBSCxVQUFJLFlBQW9CO1lBQ3BCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFFakMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzlCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFDdEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekIsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQzFCLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLElB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LGNBQUM7SUFBRCxDQUFDLEFBL0pELElBK0pDO0lBL0pxQixnQkFBTyxVQStKNUIsQ0FBQTtBQUNMLENBQUMsRUEvZGEsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUErZHJCOztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCI7XHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSAnLi9vYnNlcnZhYmxlcydcclxuXHJcbmV4cG9ydCBtb2R1bGUgUmVhY3RpdmUge1xyXG5cclxuICAgIGludGVyZmFjZSBJRXhwcmVzc2lvblBhcnNlciB7XHJcbiAgICAgICAgcGFyc2UoZXhwcjogc3RyaW5nKTogeyBleGVjdXRlKHNjb3BlOiB7IGdldChuYW1lOiBzdHJpbmcpIH0pIH07XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICAgICAgbm90aWZ5KHZhbHVlOiBJRGVwZW5kZW5jeSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElQcm9wZXJ0eSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHZhbHVlOiBhbnk7XHJcbiAgICAgICAgdXBkYXRlKHBhcmVudFZhbHVlKTtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHVibGljIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdO1xyXG4gICAgICAgIHB1YmxpYyB2YWx1ZTtcclxuXHJcbiAgICAgICAgZ2V0KHByb3BlcnR5TmFtZTogc3RyaW5nKTogSVByb3BlcnR5IHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbaV0ubmFtZSA9PT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gcHJvcGVydHlWYWx1ZVtwcm9wZXJ0eU5hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbFZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbml0aWFsVmFsdWUuYmluZChwcm9wZXJ0eVZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KHRoaXMsIHByb3BlcnR5TmFtZSk7XHJcbiAgICAgICAgICAgIHByb3BlcnR5W3Byb3BlcnR5TmFtZV0gPSBpbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlID0gaW5pdGlhbFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gW3Byb3BlcnR5XTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJvdGVjdGVkIHJlZnJlc2goKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5wcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRpc3Bvc2VkID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHkgPSB0aGlzLnByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eS51cGRhdGUodGhpcy52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkudmFsdWVPZigpID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NlZC5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZGlzcG9zZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5zcGxpY2UoZGlzcG9zZWRbaV0sIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGVwZW5kZW5jeSB7XHJcbiAgICAgICAgdW5iaW5kKGFjdGlvbjogSUFjdGlvbik6IG51bWJlciB8IGJvb2xlYW47XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgUHJvcGVydHkgZXh0ZW5kcyBWYWx1ZSBpbXBsZW1lbnRzIElEZXBlbmRlbmN5IHtcclxuICAgICAgICAvLyBsaXN0IG9mIG9ic2VydmVycyB0byBiZSBkaXNwYXRjaGVkIG9uIHZhbHVlIGNoYW5nZVxyXG4gICAgICAgIHByaXZhdGUgYWN0aW9uczogSUFjdGlvbltdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogeyB2YWx1ZTsgZ2V0KG5hbWU6IHN0cmluZykgfSwgcHVibGljIG5hbWUpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHN1cGVyLmdldChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW25hbWVdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb246IElBY3Rpb24pOiBJRGVwZW5kZW5jeSB8IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zID0gW2FjdGlvbl07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgIGlmICghYWN0aW9ucylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpZHggPSBhY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBhY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldCh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQudmFsdWVbdGhpcy5uYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUodGhpcy5wYXJlbnQudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShwYXJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gcGFyZW50VmFsdWVbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbbmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hd2FpdGVkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5hd2FpdGVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vaWYgKHRoaXMudmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcy5leHRlbnNpb25zID0gW107XHJcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzLnByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucyAmJiBhY3Rpb25zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVsZXRlIHRoaXMuYWN0aW9ucztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IGFjdGlvbnMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnNbaV0ubm90aWZ5KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGktLSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBhd2FpdGVkOiBBd2FpdGVkO1xyXG4gICAgICAgIGF3YWl0KCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hd2FpdGVkID0gbmV3IEF3YWl0ZWQodGhpcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXdhaXRlZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEF3YWl0ZWQge1xyXG4gICAgICAgIHByaXZhdGUgc3Vic2NyaXB0aW9uO1xyXG4gICAgICAgIHByaXZhdGUgYWN0aW9uczogSUFjdGlvbltdO1xyXG4gICAgICAgIHByaXZhdGUgY3VycmVudDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3Iob2JzZXJ2YWJsZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gb2JzZXJ2YWJsZS5zdWJzY3JpYmUodGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG9ic2VydmFibGUuY3VycmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uc1tpXS5ub3RpZnkodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3kgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudD86IHsgZ2V0KG5hbWU6IHN0cmluZyk7IH0pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUudmFsdWVPZigpID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3RvcmUgZXh0ZW5kcyBWYWx1ZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IodmFsdWU6IGFueSwgcHJpdmF0ZSBnbG9iYWxzOiBhbnkgPSB7fSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1cGVyLmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzdGF0aXEgPSB0aGlzLnZhbHVlLmNvbnN0cnVjdG9yICYmIHRoaXMudmFsdWUuY29uc3RydWN0b3JbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGlxID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGlxLmJpbmQodGhpcy52YWx1ZS5jb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGlxICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5nbG9iYWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZyA9IHRoaXMuZ2xvYmFsc1tpXVtuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChnICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoKSB7XHJcbiAgICAgICAgICAgIHZhciBzdGFjazogeyBwcm9wZXJ0aWVzLCB2YWx1ZSB9W10gPSBbdGhpc107XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBzdGFjay5wb3AoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocC5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBwLnByb3BlcnRpZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHByb3BlcnRpZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHAudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBwcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC51cGRhdGUodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSwgbnVsbCwgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIERlZmF1bHREaXNwYXRjaGVyIHtcclxuICAgICAgICBzdGF0aWMgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCaW5kaW5nIHtcclxuICAgICAgICBwcm90ZWN0ZWQgY29udGV4dDtcclxuICAgICAgICBwcm90ZWN0ZWQgZXh0ZW5zaW9uczogeyBuYW1lOiBhbnksIHZhbHVlOiBFeHRlbnNpb24gfVtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZGlzcGF0Y2hlcjogeyBkaXNwYXRjaChhY3Rpb246IElBY3Rpb24pIH0gPSBEZWZhdWx0RGlzcGF0Y2hlcikgeyB9XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub3RpZnkodjogSURlcGVuZGVuY3kpIHtcclxuICAgICAgICAgICAgdi51bmJpbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5kaXNwYXRjaCh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KSA6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb250ZXh0ICE9PSBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBbdGhpcy5jb250ZXh0XTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnVuYmluZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS51bmJpbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gdmFsdWUucHJvcGVydGllcztcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IHByb3BlcnRpZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChwcm9wZXJ0aWVzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoaS0tKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9ic2VydmUodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLmNoYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuY2hhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWJzdHJhY3QgcmVuZGVyKGNvbnRleHQ/KTogYW55O1xyXG5cclxuICAgICAgICBleHRlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyB0aGlzLmV4dGVuc2lvbnMgJiYgaSA8IHRoaXMuZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmV4dGVuc2lvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoeC5uYW1lID09PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlLmFkZChuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzY29wZSA9IG5ldyBFeHRlbnNpb24odGhpcy5jb250ZXh0KS5hZGQobmFtZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmV4dGVuc2lvbnMpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4dGVuc2lvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucy5wdXNoKHsgbmFtZTogdmFsdWUsIHZhbHVlOiBzY29wZSB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoZXJlKHNvdXJjZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdChzb3VyY2UsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2UubWFwKHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHF1ZXJ5KHBhcmFtLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlKHNvdXJjZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc291cmNlLmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHNvdXJjZS5nZXQoXCJsZW5ndGhcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9ic2VydmUobGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBsZW5ndGgudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHQgPSB0aGlzLmV4dGVuZChwYXJhbSwgc291cmNlLmdldChpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChpdGVtID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leHRlbmQocGFyYW0sIGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHRhcmdldC5nZXQpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRhcmdldC5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIHZhciB4cyA9IFtdLCBsZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJnICYmIGFyZy52YWx1ZU9mKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBhcmcudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh4ID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICAgICAgeHMucHVzaCh4KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeHMucHVzaChhcmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcIitcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdICsgeHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdIC0geHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcIipcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhzWzFdICogeHNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhc3NpZ25tZW50IGlzIG9ubHkgYWxsb3cgaW4gRXZlbnRCaW5kaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIHhzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0KG9ic2VydmFibGUpIHtcclxuICAgICAgICAgICAgaWYgKCFvYnNlcnZhYmxlLmF3YWl0ZWQpIHtcclxuICAgICAgICAgICAgICAgIG9ic2VydmFibGUuYXdhaXRlZCA9IG5ldyBBd2FpdGVkKG9ic2VydmFibGUudmFsdWVPZigpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlKG9ic2VydmFibGUuYXdhaXRlZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlLmF3YWl0ZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmFsdWF0ZShwYXJ0cyk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJ0cy5leGVjdXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmV4ZWN1dGUodGhpcywgdGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXJ0cykpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBDb3JlLmVtcHR5O1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0ID0gdGhpcy5ldmFsdWF0ZShwYXJ0c1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnQgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHBhcnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFJlYWN0aXZlOyJdfQ==