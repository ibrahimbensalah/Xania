/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../src/core.ts" />
/// <reference path="../src/store.ts" />
/// <reference path="../src/compile.ts" />
/// <reference path="interceptreporter.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var D;
(function (D) {
    var Value = (function () {
        function Value(name, value) {
            this.name = name;
            this.value = value;
            this.children = [];
        }
        Value.prototype.get = function (propertyName) {
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].name === propertyName)
                    return this.children[i];
            }
            var initialValue = this.value[propertyName];
            if (initialValue === void 0)
                return void 0;
            var child = this.create(propertyName, initialValue);
            child.update();
            this.children.push(child);
            return child;
        };
        return Value;
    }());
    var Store = (function (_super) {
        __extends(Store, _super);
        function Store(value) {
            var _this = _super.call(this, "root", value) || this;
            _this.dirty = [];
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
        Store.prototype.create = function (propertyName, initialValue) {
            return new Property(this, this, propertyName, initialValue);
        };
        return Store;
    }(Value));
    D.Store = Store;
    var Property = (function (_super) {
        __extends(Property, _super);
        function Property(dispatcher, parent, name, value) {
            var _this = _super.call(this, name, value) || this;
            _this.dispatcher = dispatcher;
            _this.parent = parent;
            // list of actions to be dispatched on value change
            _this.observers = [];
            return _this;
        }
        Property.prototype.create = function (propertyName, initialValue) {
            return new Property(this.dispatcher, this, propertyName, initialValue);
        };
        Property.prototype.subscribe = function (observer) {
            if (this.observers.indexOf(observer) < 0) {
                this.observers.push(observer);
                return {
                    observers: this.observers,
                    item: observer,
                    dispose: function () {
                        var idx = this.observers.indexOf(this.item);
                        if (idx < 0)
                            return false;
                        this.observers.splice(idx, 1);
                        return true;
                    }
                };
            }
            return false;
        };
        Property.prototype.update = function () {
            var newValue = this.parent.value[this.name];
            if (newValue === this.value)
                return false;
            this.value = newValue;
            if (this.value === void 0) {
            }
            else {
                // notify next
                var observers = this.observers.slice(0);
                for (var i = 0; i < observers.length; i++) {
                    observers[i].onNext(this);
                }
            }
            return true;
        };
        Property.prototype.valueOf = function () {
            return this.value;
        };
        return Property;
    }(Value));
    var Binding = (function () {
        function Binding(dispatcher, context) {
            this.dispatcher = dispatcher;
            this.context = context;
            this.subscriptions = [];
        }
        Binding.prototype.onNext = function () {
            for (var i = 0; i < this.subscriptions.length; i++) {
                this.subscriptions[i].dispose();
            }
            this.subscriptions.length = 0;
            this.dispatcher.dispatch(this);
        };
        Binding.prototype.get = function (object, name) {
            var value = object.get(name);
            if (!!value && !!value.subscribe) {
                var subscription = value.subscribe(this);
                if (!!subscription && !!subscription.dispose) {
                    this.subscriptions.push(subscription);
                }
            }
            return value;
        };
        Binding.prototype.variable = function (name) {
            return this.get(this.context, name);
        };
        Binding.prototype.render = function (value) {
            return this;
        };
        Binding.prototype.execute = function () {
            var firstName = new Xania.Compile.Ident("firstName");
            var newValue = firstName.execute(this).valueOf();
            if (this.value !== newValue) {
                this.value = newValue;
                this.render(newValue);
            }
        };
        return Binding;
    }());
    D.Binding = Binding;
})(D || (D = {}));
describe("reactive expressions", function () {
    it("set value should refresh binding", function () {
        // arrange
        var object = { firstName: "Ibrahim" };
        var store = new D.Store(object);
        var binding = new D.Binding(store, store);
        var property = store.get("firstName");
        // act: execute binding
        binding.execute();
        // assert
        expect(property.value).toBe("Ibrahim");
        expect(property.observers).toEqual([binding]);
        expect(binding.value).toBe("Ibrahim");
        expect(binding.subscriptions.length).toBe(1);
        // act: change value and notify
        object.firstName = "Ramy";
        property.update();
        // assert
        expect(property.value).toBe("Ramy");
        expect(property.observers).toEqual([]);
        expect(store.dirty.length).toBe(1);
        // binding value is still not updated
        expect(binding.value).toBe("Ibrahim");
        expect(binding.subscriptions.length).toBe(0);
        // act: apply changes
        store.flush();
        // assert
        expect(property.observers).toEqual([binding]);
        expect(store.dirty.length).toBe(0);
        expect(binding.value).toBe("Ramy");
        expect(binding.subscriptions.length).toBe(1);
    });
    function loadtest() {
        var object = { firstName: "Ibrahim" };
        var store = new D.Store(object);
        var property = store.get("firstName");
        for (var e = 0; e < 10; e++)
            new D.Binding(store, store).execute();
        var run = function () {
            var start = new Date().getTime();
            for (var i = 0; i < 1000000; i++) {
                // act: change value and notify
                object.firstName = "Ramy " + i;
                property.update();
                if (property.observers.length > 10) {
                    console.error("observers length > 1");
                    return;
                }
                if (store.dirty.length > 10) {
                    console.error("store.dirty.size = " + store.dirty.length);
                    return;
                }
                store.flush();
            }
            var end = new Date().getTime();
            console.log((end - start) / 1000);
        };
        run();
        run();
    }
});
describe("Observable", function () {
    it("scalar", function () {
        var arr = [];
        var stream = new Xania.Data.Observable();
        var subscription = stream.subscribe({
            onNext: function (v) {
                console.log(v);
                arr.push(v);
            }
        });
        stream.onNext("a");
        subscription.dispose();
        stream.onNext("b");
        expect(arr).toEqual(["a"]);
    });
});
// ReSharper restore InconsistentNaming 
//# sourceMappingURL=bindingSpec.js.map