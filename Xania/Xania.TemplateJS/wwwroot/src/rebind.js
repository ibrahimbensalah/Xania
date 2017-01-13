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
        function Value(value) {
            this.value = value;
            this.properties = [];
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
            var child = this.create(propertyName, initialValue);
            child.update();
            this.properties.push(child);
            return child;
        };
        return Value;
    }());
    var Property = (function (_super) {
        __extends(Property, _super);
        function Property(dispatcher, parent, name, value) {
            var _this = _super.call(this, value) || this;
            _this.dispatcher = dispatcher;
            _this.parent = parent;
            _this.name = name;
            _this.actions = [];
            return _this;
        }
        Property.prototype.create = function (propertyName, initialValue) {
            return new Property(this.dispatcher, this, propertyName, initialValue);
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
            if (this.value === void 0) {
            }
            else {
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
        return Property;
    }(Value));
    var Scope = (function (_super) {
        __extends(Scope, _super);
        function Scope(store, value, parent) {
            var _this = _super.call(this, value) || this;
            _this.store = store;
            _this.parent = parent;
            return _this;
        }
        Scope.prototype.create = function (propertyName, initialValue) {
            return new Property(this.store, this, propertyName, initialValue);
        };
        Scope.prototype.valueOf = function () {
            return this.value;
        };
        Scope.prototype.map = function (fn) {
            return this.value.map(fn);
        };
        Scope.prototype.extend = function (value) {
            return new Scope(value, this);
        };
        Scope.prototype.get = function (name) {
            var value = _super.prototype.get.call(this, name);
            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);
                return value;
            }
            return value;
        };
        Scope.prototype.toJSON = function () {
            var parent = this.parent;
            return Object.assign({}, this.value, parent && parent.toJSON ? parent.toJSON() : {});
        };
        Scope.prototype.toString = function () {
            return JSON.stringify(this.toJSON(), null, 4);
        };
        return Scope;
    }(Value));
    Reactive.Scope = Scope;
    var Store = (function () {
        function Store(value) {
            if (value === void 0) { value = {}; }
            this.dirty = [];
            this.root = new Scope(this, value);
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
            var value = this.root.get(name);
            if (typeof value === "undefined") {
                throw new Error("Cannot resolve variable " + name);
            }
            return value;
        };
        Store.prototype.toString = function () {
            return JSON.stringify(this.root.toJSON(), null, 4);
        };
        return Store;
    }());
    Reactive.Store = Store;
    var Binding = (function () {
        function Binding() {
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
            return core_1.Core.ready(this.state, function (s) {
                return _this.state = _this.render(context, s);
            });
        };
        Binding.prototype.render = function (context, state) {
            console.log(context);
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
            throw new Error("Not implemented");
        };
        Binding.prototype.query = function (param, source) {
            throw new Error("Not implemented");
        };
        Binding.prototype.ident = function (name) {
            return this.member(this.context, name);
        };
        Binding.prototype.member = function (target, name) {
            var value = target.get(name);
            if (value && value.change) {
                var dependency = value.change(this);
                if (!!dependency)
                    this.dependencies.push(dependency);
            }
            return value;
        };
        Binding.prototype.app = function (fun, args) {
            throw new Error("Not implemented");
        };
        Binding.prototype.const = function (value) {
            throw new Error("Not implemented");
        };
        return Binding;
    }());
    Reactive.Binding = Binding;
})(Reactive = exports.Reactive || (exports.Reactive = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmViaW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JlYmluZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBOEI7QUFFOUIsSUFBYyxRQUFRLENBcVFyQjtBQXJRRCxXQUFjLFFBQVE7SUFjbEI7UUFHSSxlQUFtQixLQUFLO1lBQUwsVUFBSyxHQUFMLEtBQUssQ0FBQTtZQUZoQixlQUFVLEdBQW1DLEVBQUUsQ0FBQztRQUd4RCxDQUFDO1FBRUQsbUJBQUcsR0FBSCxVQUFJLFlBQW9CO1lBQ3BCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDO29CQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM1QyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsQixFQUFFLENBQUMsQ0FBQyxPQUFPLFlBQVksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BELEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxVQUFVLENB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SUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxxQkFBRyxHQUFILFVBQUksR0FBRyxFQUFFLElBQVc7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCx1QkFBSyxHQUFMLFVBQU0sS0FBSztZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBQ0wsY0FBQztJQUFELENBQUMsQUF2RUQsSUF1RUM7SUF2RVksZ0JBQU8sVUF1RW5CLENBQUE7QUFFTCxDQUFDLEVBclFhLFFBQVEsR0FBUixnQkFBUSxLQUFSLGdCQUFRLFFBcVFyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCI7XHJcblxyXG5leHBvcnQgbW9kdWxlIFJlYWN0aXZlIHtcclxuXHJcbiAgICBpbnRlcmZhY2UgSUV4cHJlc3Npb25QYXJzZXIge1xyXG4gICAgICAgIHBhcnNlKGV4cHI6IHN0cmluZyk6IHsgZXhlY3V0ZShzY29wZTogeyBnZXQobmFtZTogc3RyaW5nKSB9KSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBkaXNwYXRjaChhY3Rpb246IElBY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNsYXNzIFZhbHVlIHtcclxuICAgICAgICBwcml2YXRlIHByb3BlcnRpZXM6IHsgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55IH1bXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdmFsdWUpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldChwcm9wZXJ0eU5hbWU6IHN0cmluZyk6IHsgdmFsdWU7IH0ge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1tpXS5uYW1lID09PSBwcm9wZXJ0eU5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxWYWx1ZSA9IHRoaXMudmFsdWVbcHJvcGVydHlOYW1lXTtcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbFZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbml0aWFsVmFsdWUuYmluZCh0aGlzLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jcmVhdGUocHJvcGVydHlOYW1lLCBpbml0aWFsVmFsdWUpO1xyXG4gICAgICAgICAgICBjaGlsZC51cGRhdGUoKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnB1c2goY2hpbGQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWJzdHJhY3QgY3JlYXRlKHByb3BlcnR5TmFtZTogc3RyaW5nLCBpbml0aWFsVmFsdWUpOiB7IG5hbWU6IHN0cmluZywgdmFsdWUsIHVwZGF0ZSgpIH07XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEZXBlbmRlbmN5PFQ+IHtcclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBUKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBQcm9wZXJ0eSBleHRlbmRzIFZhbHVlIGltcGxlbWVudHMgSURlcGVuZGVuY3k8SUFjdGlvbj4ge1xyXG4gICAgICAgIC8vIGxpc3Qgb2Ygb2JzZXJ2ZXJzIHRvIGJlIGRpc3BhdGNoZWQgb24gdmFsdWUgY2hhbmdlXHJcbiAgICAgICAgcHVibGljIGFjdGlvbnM6IElBY3Rpb25bXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyLCBwcml2YXRlIHBhcmVudDogeyB2YWx1ZTsgfSwgcHVibGljIG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNyZWF0ZShwcm9wZXJ0eU5hbWU6IHN0cmluZywgaW5pdGlhbFZhbHVlKTogeyBuYW1lOiBzdHJpbmcsIHZhbHVlLCB1cGRhdGUoKSB9IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9wZXJ0eSh0aGlzLmRpc3BhdGNoZXIsIHRoaXMsIHByb3BlcnR5TmFtZSwgaW5pdGlhbFZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb246IElBY3Rpb24pOiBJRGVwZW5kZW5jeTxJQWN0aW9uPiB8IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zLmluZGV4T2YoYWN0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1bmJpbmQoYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXQodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy52YWx1ZSAhPT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnZhbHVlW3RoaXMubmFtZV0gPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMucGFyZW50LnZhbHVlW3RoaXMubmFtZV07XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdGhpcy52YWx1ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBkb25lXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBub3RpZnkgbmV4dFxyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTY29wZSBleHRlbmRzIFZhbHVlIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHN0b3JlOiBTdG9yZSwgdmFsdWU6IGFueSwgcHJpdmF0ZSBwYXJlbnQ/OiB7IGdldChuYW1lOiBzdHJpbmcpOyB9KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNyZWF0ZShwcm9wZXJ0eU5hbWU6IHN0cmluZywgaW5pdGlhbFZhbHVlKTogeyBuYW1lOiBzdHJpbmcsIHZhbHVlLCB1cGRhdGUoKSB9IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9wZXJ0eSh0aGlzLnN0b3JlLCB0aGlzLCBwcm9wZXJ0eU5hbWUsIGluaXRpYWxWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcChmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5tYXAoZm4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTY29wZSh2YWx1ZSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1cGVyLmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9KU09OKCkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50OiBhbnkgPSB0aGlzLnBhcmVudDtcclxuICAgICAgICAgICAgcmV0dXJuICg8YW55Pk9iamVjdCkuYXNzaWduKHt9LCB0aGlzLnZhbHVlLCBwYXJlbnQgJiYgcGFyZW50LnRvSlNPTiA/IHBhcmVudC50b0pTT04oKSA6IHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy50b0pTT04oKSwgbnVsbCwgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdG9yZSBpbXBsZW1lbnRzIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBwdWJsaWMgZGlydHkgPSBbXTtcclxuICAgICAgICBwdWJsaWMgcm9vdDogU2NvcGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnkgPSB7fSkge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBuZXcgU2NvcGUodGhpcywgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBJQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmx1c2goKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkuZm9yRWFjaChkID0+IHtcclxuICAgICAgICAgICAgICAgIGQuZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5kaXJ0eS5sZW5ndGggPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnJvb3QuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlc29sdmUgdmFyaWFibGUgXCIgKyBuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnJvb3QudG9KU09OKCksIG51bGwsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQmluZGluZyB7XHJcblxyXG4gICAgICAgIHB1YmxpYyBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmN5PElBY3Rpb24+W10gPSBbXTtcclxuICAgICAgICBwcm90ZWN0ZWQgY29udGV4dDtcclxuICAgICAgICBwdWJsaWMgc3RhdGU7XHJcblxyXG4gICAgICAgIGV4ZWN1dGUoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kZXBlbmRlbmNpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzW2ldLnVuYmluZCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRlcGVuZGVuY2llcy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGUodGhpcy5jb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gQ29yZS5yZWFkeSh0aGlzLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUgPSB0aGlzLnJlbmRlcihjb250ZXh0LCBzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZCgpOiBhbnkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlkZW50KG5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWVtYmVyKHRoaXMuY29udGV4dCwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW1iZXIodGFyZ2V0OiB7IGdldChuYW1lOiBzdHJpbmcpIH0sIG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5jaGFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkZXBlbmRlbmN5ID0gdmFsdWUuY2hhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhZGVwZW5kZW5jeSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlcGVuZGVuY2llcy5wdXNoKGRlcGVuZGVuY3kpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSJdfQ==