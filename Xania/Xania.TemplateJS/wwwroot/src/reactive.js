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
            var property = new Property(this.dispatcher, this, propertyName);
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
        Value.prototype.extend = function (name, value) {
            for (var i = 0; this.extensions && i < this.extensions.length; i++) {
                var x = this.extensions[i];
                if (x.name === value) {
                    return x.value;
                }
            }
            var scope = new Extension(this.dispatcher, this).add(name, value);
            if (!this.extensions)
                this.extensions = [];
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
            if (!this.actions)
                return false;
            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;
            this.actions.splice(idx, 1);
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
            var newValue = parentValue[this.name];
            if (newValue !== this.value) {
                this[this.name] = newValue;
                this.value = newValue;
                if (this.awaited) {
                    this.awaited.dispose();
                    delete this.awaited;
                }
                var actions = this.actions;
                if (actions) {
                    var i = actions.length - 1, dispatcher = this.dispatcher;
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
                this.awaited = new Awaited(this);
            }
            return this.awaited;
        };
        return Property;
    }(Value));
    var Awaited = (function () {
        function Awaited(property) {
            this.property = property;
            this.subscription = property.value.subscribe(this);
            this.current = property.value.current;
        }
        Awaited.prototype.onNext = function (newValue) {
            if (this.current !== newValue) {
                this.current = newValue;
                if (this.actions) {
                    var actions = this.actions.slice(0);
                    for (var i = 0; i < actions.length; i++) {
                        this.property.dispatcher.dispatch(actions[i]);
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
    var Extension = (function () {
        function Extension(dispatcher, parent) {
            this.dispatcher = dispatcher;
            this.parent = parent;
        }
        Extension.prototype.add = function (name, value) {
            this[name] = value;
            return this;
        };
        Extension.prototype.extend = function (name, value) {
            if (this.extensions) {
                for (var i = 0; i < this.extensions.length; i++) {
                    var x = this.extensions[i];
                    if (x.name === value) {
                        return x.value;
                    }
                }
            }
            else {
                this.extensions = [];
            }
            var scope = new Extension(this.dispatcher, this).add(name, value);
            this.extensions.push({ name: value, value: scope });
            return scope;
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
    var DefaultDispatcher = (function () {
        function DefaultDispatcher() {
        }
        DefaultDispatcher.dispatch = function (action) {
            action.execute();
        };
        return DefaultDispatcher;
    }());
    var Store = (function (_super) {
        __extends(Store, _super);
        function Store(value, globals, dispatcher) {
            if (globals === void 0) { globals = {}; }
            if (dispatcher === void 0) { dispatcher = DefaultDispatcher; }
            var _this = _super.call(this, dispatcher) || this;
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
        Binding.prototype.observe = function (value) {
            if (value && value.change) {
                value.change(this);
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
            this.observe(source);
            if (source.get) {
                var length = source.get("length");
                this.observe(length);
                var result = [];
                for (var i = 0; i < length; i++) {
                    var ext = this.context.extend(param, source.get(i));
                    result.push(ext);
                }
                return result;
            }
            else {
                return source.map(function (item) {
                    return _this.context.extend(param, item);
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
            var xs = [];
            for (var i = 0; i < args.length; i++) {
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
            var awaitable = observable.await();
            this.observe(awaitable);
            return awaitable;
        };
        Binding.prototype.evaluate = function (parts) {
            if (typeof parts === "object" && typeof parts.length === "number") {
                return this.evaluateParts(parts);
            }
            else {
                return this.evaluatePart(parts);
            }
        };
        Binding.prototype.evaluateParts = function (parts) {
            var length = parts.length;
            if (length === 0)
                return Binding.empty;
            if (length === 1)
                return this.evaluatePart(parts[0]);
            var concatenated = Binding.empty;
            for (var i = 0; i < length; i++) {
                var p = this.evaluatePart(parts[i]);
                if (p === void 0)
                    return void 0;
                var inner = p.valueOf();
                if (inner === void 0)
                    return void 0;
                if (inner !== null)
                    concatenated += inner;
            }
            return concatenated;
        };
        Binding.prototype.evaluatePart = function (part) {
            if (typeof part === "string")
                return part;
            else {
                var value = part.execute(this, this.context);
                return value && value.valueOf();
            }
        };
        return Binding;
    }());
    Binding.empty = "";
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Reactive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBR0EsSUFBYyxRQUFRLENBK2ZyQjtBQS9mRCxXQUFjLFFBQVE7SUFzQmxCO1FBS0ksZUFBbUIsVUFBdUI7WUFBdkIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUMxQyxDQUFDO1FBR0QsbUJBQUcsR0FBSCxVQUFJLFlBQW9CO1lBQ3BCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFFakMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzlCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFDdEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekIsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQzFCLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEIsRUFBRSxDQUFDLENBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksUUFB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QTFHQSxnQkFBTyxVQWlKNUIsQ0FBQTtBQUVMLENBQUMsRUEvZmEsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUErZnJCOztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCI7XHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSAnLi9vYnNlcnZhYmxlcydcclxuXHJcbmV4cG9ydCBtb2R1bGUgUmVhY3RpdmUge1xyXG5cclxuICAgIGludGVyZmFjZSBJRXhwcmVzc2lvblBhcnNlciB7XHJcbiAgICAgICAgcGFyc2UoZXhwcjogc3RyaW5nKTogeyBleGVjdXRlKHNjb3BlOiB7IGdldChuYW1lOiBzdHJpbmcpIH0pIH07XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElBY3Rpb24ge1xyXG4gICAgICAgIGV4ZWN1dGUoKTtcclxuICAgICAgICBub3RpZnkodmFsdWU6IElEZXBlbmRlbmN5KTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURpc3BhdGNoZXIge1xyXG4gICAgICAgIGRpc3BhdGNoKGFjdGlvbjogSUFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElQcm9wZXJ0eSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHZhbHVlOiBhbnk7XHJcbiAgICAgICAgdXBkYXRlKHBhcmVudFZhbHVlKTtcclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nIHwgbnVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjbGFzcyBWYWx1ZSB7XHJcbiAgICAgICAgcHVibGljIHByb3BlcnRpZXM6IElQcm9wZXJ0eVtdO1xyXG4gICAgICAgIHByb3RlY3RlZCBleHRlbnNpb25zOiB7IG5hbWU6IGFueSwgdmFsdWU6IEV4dGVuc2lvbiB9W107XHJcbiAgICAgICAgcHVibGljIHZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBnZXQocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBJUHJvcGVydHkge1xyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHRoaXMucHJvcGVydGllcztcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBwcm9wZXJ0aWVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1tpXS5uYW1lID09PSBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZSA9IHRoaXMudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBpbml0aWFsVmFsdWUgPSBwcm9wZXJ0eVZhbHVlW3Byb3BlcnR5TmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbFZhbHVlID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsVmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluaXRpYWxWYWx1ZS5iaW5kKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkodGhpcy5kaXNwYXRjaGVyLCB0aGlzLCBwcm9wZXJ0eU5hbWUpO1xyXG4gICAgICAgICAgICBwcm9wZXJ0eVtwcm9wZXJ0eU5hbWVdID0gaW5pdGlhbFZhbHVlO1xyXG4gICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghcHJvcGVydGllcylcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyA9IFtwcm9wZXJ0eV07XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChwcm9wZXJ0eSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByb3RlY3RlZCByZWZyZXNoKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMucHJvcGVydGllcylcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHZhciBkaXNwb3NlZCA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gdGhpcy5wcm9wZXJ0aWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkudXBkYXRlKHRoaXMudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnZhbHVlT2YoKSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zZWQucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGRpc3Bvc2VkLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMuc3BsaWNlKGRpc3Bvc2VkW2ldLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgdGhpcy5leHRlbnNpb25zICYmIGkgPCB0aGlzLmV4dGVuc2lvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5leHRlbnNpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHgubmFtZSA9PT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNjb3BlID0gbmV3IEV4dGVuc2lvbih0aGlzLmRpc3BhdGNoZXIsIHRoaXMpLmFkZChuYW1lLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZXh0ZW5zaW9ucylcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goeyBuYW1lOiB2YWx1ZSwgdmFsdWU6IHNjb3BlIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNjb3BlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURlcGVuZGVuY3kge1xyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pOiBudW1iZXIgfCBib29sZWFuO1xyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFByb3BlcnR5IGV4dGVuZHMgVmFsdWUgaW1wbGVtZW50cyBJRGVwZW5kZW5jeSB7XHJcbiAgICAgICAgLy8gbGlzdCBvZiBvYnNlcnZlcnMgdG8gYmUgZGlzcGF0Y2hlZCBvbiB2YWx1ZSBjaGFuZ2VcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIsIHByaXZhdGUgcGFyZW50OiB7IHZhbHVlOyBnZXQobmFtZTogc3RyaW5nKSB9LCBwdWJsaWMgbmFtZSkge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHN1cGVyLmdldChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW25hbWVdID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldChuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb246IElBY3Rpb24pOiBJRGVwZW5kZW5jeSB8IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuYWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zID0gW2FjdGlvbl07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0KHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC52YWx1ZVt0aGlzLm5hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSh0aGlzLnBhcmVudC52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKHBhcmVudFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHBhcmVudFZhbHVlW3RoaXMubmFtZV07XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpc1t0aGlzLm5hbWVdID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV3VmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXdhaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXdhaXRlZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYXdhaXRlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmICh0aGlzLnZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIC8vICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcy5wcm9wZXJ0aWVzID0gW107XHJcbiAgICAgICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5hY3Rpb25zO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlbGV0ZSB0aGlzLmFjdGlvbnM7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBhY3Rpb25zLmxlbmd0aC0xLCBkaXNwYXRjaGVyID0gdGhpcy5kaXNwYXRjaGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uc1tpXS5ub3RpZnkodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoaS0tKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGF3YWl0ZWQ6IEF3YWl0ZWQ7XHJcbiAgICAgICAgYXdhaXQoKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hd2FpdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF3YWl0ZWQgPSBuZXcgQXdhaXRlZCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hd2FpdGVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBBd2FpdGVkIHtcclxuICAgICAgICBwcml2YXRlIHN1YnNjcmlwdGlvbjtcclxuICAgICAgICBwcml2YXRlIGFjdGlvbnM6IElBY3Rpb25bXTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IFByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gcHJvcGVydHkudmFsdWUuc3Vic2NyaWJlKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBwcm9wZXJ0eS52YWx1ZS5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnQgIT09IG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5hY3Rpb25zLnNsaWNlKDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnR5LmRpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGFuZ2UoYWN0aW9uOiBJQWN0aW9uKTogSURlcGVuZGVuY3kgfCBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IFthY3Rpb25dO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuYWN0aW9ucy5pbmRleE9mKGFjdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggPCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuICAgICAgICBwcm90ZWN0ZWQgZXh0ZW5zaW9uczogeyBuYW1lOiBhbnksIHZhbHVlOiBFeHRlbnNpb24gfVtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBwcml2YXRlIHBhcmVudD86IHsgZ2V0KG5hbWU6IHN0cmluZyk7IH0pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5leHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5leHRlbnNpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh4Lm5hbWUgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc2NvcGUgPSBuZXcgRXh0ZW5zaW9uKHRoaXMuZGlzcGF0Y2hlciwgdGhpcykuYWRkKG5hbWUsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucy5wdXNoKHsgbmFtZTogdmFsdWUsIHZhbHVlOiBzY29wZSB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpc1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlT2YoKSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgRGVmYXVsdERpc3BhdGNoZXIge1xyXG4gICAgICAgIHN0YXRpYyBkaXNwYXRjaChhY3Rpb246IElBY3Rpb24pIHtcclxuICAgICAgICAgICAgYWN0aW9uLmV4ZWN1dGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN0b3JlIGV4dGVuZHMgVmFsdWUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnksIHByaXZhdGUgZ2xvYmFsczogYW55ID0ge30sIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyID0gRGVmYXVsdERpc3BhdGNoZXIpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gc3VwZXIuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0YXRpcSA9IHRoaXMudmFsdWUuY29uc3RydWN0b3IgJiYgdGhpcy52YWx1ZS5jb25zdHJ1Y3RvcltuYW1lXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0aXEgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0aXEuYmluZCh0aGlzLnZhbHVlLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0aXEgIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpcTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdsb2JhbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBnID0gdGhpcy5nbG9iYWxzW2ldW25hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGcgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZSgpIHtcclxuICAgICAgICAgICAgdmFyIHN0YWNrOiB7IHByb3BlcnRpZXMsIHZhbHVlIH1bXSA9IFt0aGlzXTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHN0YWNrLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwLnByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHAucHJvcGVydGllcztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHJvcGVydGllcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnVwZGF0ZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnZhbHVlLCBudWxsLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJpbmRpbmcge1xyXG4gICAgICAgIHByb3RlY3RlZCBjb250ZXh0O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyID0gRGVmYXVsdERpc3BhdGNoZXIpIHsgfVxyXG5cclxuICAgICAgICBleGVjdXRlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm90aWZ5KHY6IElEZXBlbmRlbmN5KSB7XHJcbiAgICAgICAgICAgIHYudW5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2godGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb250ZXh0ICE9PSBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgb2JzZXJ2ZSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuY2hhbmdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5jaGFuZ2UodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhYnN0cmFjdCByZW5kZXIoY29udGV4dD8pOiBhbnk7XHJcblxyXG4gICAgICAgIGV4dGVuZCgpOiBhbnkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gc291cmNlLm1hcChzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5nZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBzb3VyY2UuZ2V0KFwibGVuZ3RoXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vYnNlcnZlKGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4dCA9IHRoaXMuY29udGV4dC5leHRlbmQocGFyYW0sIHNvdXJjZS5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5leHRlbmQocGFyYW0sIGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZykgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHRhcmdldC5nZXQpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRhcmdldC5nZXQobmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIHZhciB4cyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZyAmJiBhcmcudmFsdWVPZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gYXJnLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHhzLnB1c2goeCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHhzLnB1c2goYXJnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZ1biA9PT0gXCIrXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB4c1sxXSArIHhzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZ1biA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB4c1sxXSAtIHhzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZ1biA9PT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB4c1sxXSAqIHhzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZ1biA9PT0gXCJhc3NpZ25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXNzaWdubWVudCBpcyBvbmx5IGFsbG93IGluIEV2ZW50QmluZGluZ1wiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseShudWxsLCB4cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdChvYnNlcnZhYmxlKSB7XHJcbiAgICAgICAgICAgIHZhciBhd2FpdGFibGUgPSBvYnNlcnZhYmxlLmF3YWl0KCk7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZShhd2FpdGFibGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXRhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGVtcHR5ID0gXCJcIjtcclxuICAgICAgICBldmFsdWF0ZShwYXJ0cyk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHBhcnRzLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXZhbHVhdGVQYXJ0cyhwYXJ0cyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ldmFsdWF0ZVBhcnQocGFydHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmFsdWF0ZVBhcnRzKHBhcnRzKTogYW55IHtcclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHBhcnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBCaW5kaW5nLmVtcHR5O1xyXG5cclxuICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChwYXJ0c1swXSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgY29uY2F0ZW5hdGVkID0gQmluZGluZy5lbXB0eTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLmV2YWx1YXRlUGFydChwYXJ0c1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5uZXIgPSBwLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbm5lciA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5uZXIgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uY2F0ZW5hdGVkICs9IGlubmVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25jYXRlbmF0ZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmFsdWF0ZVBhcnQocGFydDogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0O1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnQuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFJlYWN0aXZlOyJdfQ==