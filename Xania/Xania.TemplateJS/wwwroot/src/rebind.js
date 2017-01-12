System.register(["./expression"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var __moduleName = context_1 && context_1.id;
    var expression_1, Reactive;
    return {
        setters: [
            function (expression_1_1) {
                expression_1 = expression_1_1;
            }
        ],
        execute: function () {
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
                    function Binding(context, ast) {
                        this.context = context;
                        this.ast = ast;
                        this.dependencies = [];
                    }
                    Binding.prototype.execute = function () {
                        for (var i = 0; i < this.dependencies.length; i++) {
                            this.dependencies[i].unbind(this);
                        }
                        this.dependencies.length = 0;
                        var result = expression_1.Expression.accept(this.ast, this).valueOf();
                        console.log(result);
                        return result;
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
            })(Reactive || (Reactive = {}));
            exports_1("Reactive", Reactive);
        }
    };
});
//# sourceMappingURL=rebind.js.map