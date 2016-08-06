var TextTemplate = (function () {
    function TextTemplate(tpl) {
        this.tpl = tpl;
    }
    TextTemplate.prototype.execute = function (context) {
        return typeof this.tpl == "function"
            ? this.tpl(context)
            : this.tpl;
    };
    TextTemplate.prototype.bind = function (model) {
        return new ContentBinding(this, model);
    };
    TextTemplate.prototype.toString = function () {
        return this.tpl.toString();
    };
    TextTemplate.prototype.children = function () {
        return [];
    };
    return TextTemplate;
})();
var TagTemplate = (function () {
    function TagTemplate(name) {
        this.name = name;
        this.attributes = new Map();
        this.events = new Map();
        this._children = [];
    }
    TagTemplate.prototype.children = function () {
        return this._children;
    };
    TagTemplate.prototype.attr = function (name, value) {
        return this.addAttribute(name, value);
    };
    TagTemplate.prototype.addAttribute = function (name, value) {
        var tpl = typeof (value) === "function"
            ? value
            : function () { return value; };
        this.attributes.set(name, tpl);
        return this;
    };
    TagTemplate.prototype.addEvent = function (name, callback) {
        this.events.set(name, callback);
    };
    TagTemplate.prototype.addChild = function (child) {
        this._children.push(child);
        return this;
    };
    TagTemplate.prototype.bind = function (model) {
        return new TagBinding(this, model);
    };
    TagTemplate.prototype.for = function (forExpression, loader) {
        var selectManyExpr = SelectManyExpression.parse(forExpression, loader);
        this.modelAccessor = selectManyExpr.executeAsync.bind(selectManyExpr);
        return this;
    };
    TagTemplate.prototype.executeAttributes = function (context) {
        var result = {
            "class": []
        };
        this.attributes.forEach(function (tpl, name) {
            var value = tpl(context);
            if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    result["class"].push(className);
                }
            }
            else if (name === "class") {
                var cls = value.split(" ");
                result["class"].push.apply(result["class"], cls);
            }
            else {
                result[name] = value;
            }
        });
        return result;
    };
    TagTemplate.prototype.executeEvents = function (context) {
        var _this = this;
        var result = {};
        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
        }
        this.events.forEach(function (callback, eventName) {
            result[eventName] = callback.bind(_this, context);
        });
        return result;
    };
    return TagTemplate;
})();
var SelectManyExpression = (function () {
    function SelectManyExpression(varName, viewModel, collectionExpr, loader) {
        this.varName = varName;
        this.viewModel = viewModel;
        this.collectionExpr = collectionExpr;
        this.loader = loader;
        this.items = [];
        if (collectionExpr === undefined || collectionExpr === null) {
            throw new Error("null argument exception");
        }
    }
    SelectManyExpression.prototype.executeAsync = function (context) {
        var collectionFunc = new Function("m", "with(m) { return " + this.collectionExpr + "; }"), varName = this.varName;
        if (Array.isArray(context))
            throw new Error("context is Array");
        var col = collectionFunc(context);
        return Xania.ready(col).then(function (data) {
            var arr = Array.isArray(data) ? data : [data];
            var results = [];
            for (var i = 0; i < arr.length; i++) {
                var result = {};
                result[varName] = arr[i];
                results.push(result);
            }
            return results;
        });
    };
    SelectManyExpression.parse = function (expr, loader) {
        if (loader === void 0) { loader = function (t) { return window[t]; }; }
        var m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+of\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            var varName = m[1], itemType = m[3], directive = m[5], collectionExpr = m[6];
            var viewModel = loader(itemType);
            return new SelectManyExpression(varName, viewModel, collectionExpr, loader);
        }
        return null;
    };
    SelectManyExpression.ensureIsArray = function (obj) {
        return Array.isArray(obj) ? obj : [obj];
    };
    return SelectManyExpression;
})();
var Value = (function () {
    function Value(obj) {
        this.obj = obj;
    }
    Value.prototype.valueOf = function () {
        return this.obj;
    };
    return Value;
})();
var Xania = (function () {
    function Xania() {
    }
    Xania.identity = function (x) {
        return x;
    };
    Xania.ready = function (data) {
        if (!!data && typeof (data.then) === "function") {
            return data;
        }
        return {
            then: function (resolve) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var result = resolve.apply(this, args.concat([data]));
                return Xania.ready(result);
            }
        };
    };
    Xania.map = function (fn, data) {
        if (typeof data.then === "function") {
            return data.then(function (arr) {
                Xania.map(fn, arr);
            });
        }
        else if (typeof data.map === "function") {
            data.map(fn);
        }
        else if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                fn.call(this, data[i], i, data);
            }
        }
        else {
            fn.call(this, data, 0, [data]);
        }
    };
    Xania.collect = function (fn, data) {
        if (Array.isArray(data)) {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                var items = fn.call(this, data[i]);
                Array.prototype.push.apply(result, items);
            }
            return result;
        }
        else {
            return [fn.call(this, data)];
        }
    };
    Xania.count = function (data) {
        if (data === null || typeof data === "undefined")
            return 0;
        return !!data.length ? data.length : 1;
    };
    Xania.compose = function () {
        var fns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fns[_i - 0] = arguments[_i];
        }
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                result = fns[i].call(this, result);
            }
            return result;
        };
    };
    Xania.partialApp = function (fn) {
        var partialArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            partialArgs[_i - 1] = arguments[_i];
        }
        return function () {
            var additionalArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                additionalArgs[_i - 0] = arguments[_i];
            }
            var args = [].concat(partialArgs, additionalArgs);
            return fn.apply(this, args);
        };
    };
    Xania.observe = function (target, observer) {
        if (!target)
            return target;
        if (target.isSpy)
            throw new Error("observe observable is not allowed");
        if (typeof target === "object") {
            if (Array.isArray(target))
                return Xania.observeArray(target, observer);
            else
                return Xania.observeObject(target, observer);
        }
        else {
            return target;
        }
    };
    Xania.observeArray = function (target, observer) {
        var ProxyConst = window["Proxy"];
        return new ProxyConst(target, {
            get: function (target, property) {
                switch (property) {
                    case "isSpy":
                        return true;
                    case "empty":
                        observer.setRead(target, "length");
                        return target.length === 0;
                    case "valueOf":
                        return function () { return target; };
                    default:
                        return Xania.observeProperty(target, property, observer);
                }
            },
            set: function (target, property, value, receiver) {
                var unwrapped = Xania.unwrap(value);
                if (target[property] !== unwrapped) {
                    var length = target.length;
                    target[property] = unwrapped;
                    observer.setChange(target, property);
                    if (target.length !== length)
                        observer.setChange(target, "length");
                }
                return true;
            }
        });
    };
    Xania.unwrap = function (obj) {
        if (obj === null || typeof (obj) !== "object")
            return obj;
        if (!!obj._unwrapping)
            return obj;
        if (!!obj.isSpy) {
            return obj.valueOf();
        }
        obj._unwrapping = true;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = Xania.unwrap(obj[prop]);
            }
        }
        delete obj._unwrapping;
        return obj;
    };
    Xania.observeObject = function (target, observer) {
        function Spy() { }
        if (target.constructor !== Object) {
            function __() {
                this.constructor = Spy;
            }
            ;
            __.prototype = target.constructor.prototype;
            Spy.prototype = new __();
        }
        Spy.prototype.valueOf = function () { return target; };
        Object.defineProperty(Spy.prototype, "isSpy", { get: function () { return true; }, enumerable: false });
        var props = Object.getOwnPropertyNames(target);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            Object.defineProperty(Spy.prototype, prop, {
                get: Xania.partialApp(function (obj, name) {
                    observer.setRead(obj, name);
                    return Xania.observeProperty(obj, name, observer);
                }, target, prop),
                set: Xania.partialApp(function (obj, name, value) {
                    var unwrapped = Xania.unwrap(value);
                    if (obj[name] !== unwrapped) {
                        obj[name] = unwrapped;
                        observer.setChange(obj, name);
                    }
                }, target, prop),
                enumerable: true,
                configurable: true
            });
        }
        return new Spy;
    };
    Xania.observeProperty = function (object, propertyName, observer) {
        var propertyValue = object[propertyName];
        if (typeof propertyValue === "function") {
            return function () {
                var proxy = Xania.observe(object, observer);
                var retval = propertyValue.apply(proxy, arguments);
                return Xania.observe(retval, observer);
            };
        }
        else {
            observer.setRead(object, propertyName);
            if (propertyValue === null || typeof propertyValue === "undefined") {
                return null;
            }
            else {
                return Xania.observe(propertyValue, observer);
            }
        }
    };
    Xania.construct = function (viewModel, data) {
        //return Xania.assign(new viewModel, data);
        var _this = this;
        function Proxy() {
        }
        function __() {
            this.constructor = Proxy;
        }
        ;
        __.prototype = data.constructor.prototype;
        Proxy.prototype = new __();
        for (var fn in viewModel.prototype) {
            if (viewModel.prototype.hasOwnProperty(fn)) {
                console.log(fn);
                Proxy.prototype[fn] = viewModel.prototype[fn];
            }
        }
        for (var prop in data) {
            if (data.hasOwnProperty(prop)) {
                Object.defineProperty(Proxy.prototype, prop, {
                    get: Xania.partialApp(function (obj, name) { return _this[name]; }, data, prop),
                    enumerable: false,
                    configurable: false
                });
            }
        }
        Proxy.prototype.valueOf = function () { return Xania.construct(viewModel, data.valueOf()); };
        return new Proxy();
    };
    Xania.shallow = function (obj) {
        return Xania.assign({}, obj);
    };
    Xania.assign = function (target) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var i = 0; i < args.length; i++) {
            var object = args[i];
            for (var prop in object) {
                if (object.hasOwnProperty(prop)) {
                    target[prop] = object[prop];
                }
            }
        }
        return target;
    };
    Xania.join = function (separator, value) {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.sort().join(separator) : null;
        }
        return value;
    };
    return Xania;
})();
//# sourceMappingURL=core.js.map