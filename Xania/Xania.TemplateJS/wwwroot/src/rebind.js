System.register(["./core"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, Reactive;
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            }
        ],
        execute: function () {
            (function (Reactive) {
                var Store = (function () {
                    function Store(model) {
                        this.model = model;
                        this.rootBinding = new Binding(new core_1.Core.Scope(model));
                    }
                    Store.prototype.bind = function (selector, handler) {
                        var result = selector.execute(this.rootBinding);
                        handler(result);
                    };
                    Store.prototype.get = function (name) {
                        return new Store(this.model[name]);
                    };
                    Store.prototype.extend = function (object) {
                        return new Store(object);
                    };
                    return Store;
                }());
                Reactive.Store = Store;
                var Binding = (function () {
                    function Binding(scope) {
                        this.scope = scope;
                    }
                    Binding.prototype.get = function (name) {
                    };
                    Binding.prototype.extend = function () {
                        return this;
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