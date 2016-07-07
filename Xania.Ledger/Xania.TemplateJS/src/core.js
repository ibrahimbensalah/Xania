var TextContent = (function () {
    function TextContent(tpl) {
        this.tpl = tpl;
    }
    TextContent.prototype.execute = function (context) {
        return typeof this.tpl == "function"
            ? this.tpl(context)
            : this.tpl;
    };
    TextContent.prototype.bind = function (model, idx) {
        return new ContentBinding(this, model, idx);
    };
    TextContent.prototype.toString = function () {
        return this.tpl.toString();
    };
    return TextContent;
})();
var TagElement = (function () {
    function TagElement(name) {
        this.name = name;
        this.attributes = new Map();
        this.events = new Map();
        this.data = new Map();
        this._children = [];
        this.modelAccessor = Xania.identity;
    }
    TagElement.prototype.children = function () {
        return this._children;
    };
    TagElement.prototype.attr = function (name, value) {
        return this.addAttribute(name, value);
    };
    TagElement.prototype.addAttribute = function (name, value) {
        var tpl = typeof (value) === "function"
            ? value
            : function () { return value; };
        this.attributes.add(name, tpl);
        return this;
    };
    TagElement.prototype.addEvent = function (name, callback) {
        this.events.add(name, callback);
    };
    TagElement.prototype.addChild = function (child) {
        this._children.push(child);
        return this;
    };
    TagElement.prototype.bind = function (model) {
        return new TagBinding(this, model, 0);
    };
    TagElement.prototype.for = function (forExpression, loader) {
        var selectManyExpr = SelectManyExpression.parse(forExpression, loader);
        this.modelIdentifier = selectManyExpr.collectionExpr;
        this.modelAccessor = function (model) { return ({
            then: function (resolve) {
                return selectManyExpr.executeAsync(model, resolve);
            }
        }); };
        return this;
    };
    TagElement.prototype.executeAttributes = function (context) {
        var result = {}, attrs = this.attributes;
        for (var i = 0; i < attrs.keys.length; i++) {
            var name = attrs.keys[i];
            var tpl = attrs.get(name);
            result[name] = tpl(context);
        }
        return result;
    };
    TagElement.prototype.executeEvents = function (context) {
        var result = {};
        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
        }
        for (var i = 0; i < this.events.keys.length; i++) {
            var eventName = this.events.keys[i];
            var callback = this.events.elementAt(i);
            result[eventName] = callback.bind(this, context);
        }
        return result;
    };
    return TagElement;
})();
var SelectManyExpression = (function () {
    function SelectManyExpression(varName, viewModel, collectionExpr, loader) {
        this.varName = varName;
        this.viewModel = viewModel;
        this.collectionExpr = collectionExpr;
        this.loader = loader;
    }
    SelectManyExpression.prototype.execute = function (context) {
        var result = [];
        this.executeAsync(context, result.push.bind(result));
        return result;
    };
    SelectManyExpression.prototype.executeAsync = function (context, resolve) {
        var _this = this;
        var ensureIsArray = SelectManyExpression.ensureIsArray, source = ensureIsArray(context), viewModel = this.viewModel;
        var itemHandler = function (src, item) {
            var p = Xania.extend(src);
            p.prop(_this.varName, (function (x) {
                return typeof viewModel !== "undefined" && viewModel !== null
                    ? Xania.extend(viewModel).init(x).create()
                    : x;
            }).bind(_this, item));
            var obj = p.create();
            resolve(obj);
        };
        var arrayHandler = function (src, data) {
            if (typeof data.map === "function") {
                data.map(function (item) { return itemHandler(src, item); });
            }
            else {
                itemHandler(src, data);
            }
        };
        var collectionFunc = new Function("m", "with(m) { return " + this.collectionExpr + "; }");
        for (var i = 0; i < source.length; i++) {
            var col = collectionFunc(source[i]);
            if (typeof (col.then) === "function") {
                col.then(arrayHandler.bind(this, source[i]));
            }
            else {
                arrayHandler.call(this, source[i], col);
            }
        }
    };
    SelectManyExpression.parse = function (expr, loader) {
        if (loader === void 0) { loader = function (t) { return window[t]; }; }
        var m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
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
var Map = (function () {
    function Map() {
        this.items = {};
        this.keys = [];
    }
    Map.prototype.add = function (key, child) {
        this.items[key] = child;
        this.keys = Object.keys(this.items);
    };
    Map.prototype.get = function (key) {
        return this.items[key];
    };
    Object.defineProperty(Map.prototype, "length", {
        get: function () {
            return this.keys.length;
        },
        enumerable: true,
        configurable: true
    });
    Map.prototype.elementAt = function (i) {
        var key = this.keys[i];
        return key && this.get(key);
    };
    return Map;
})();
var Xania = (function () {
    function Xania() {
    }
    Xania.identity = function (x) {
        return x;
    };
    Xania.map = function (fn, data) {
        if (typeof data.map === "function") {
            data.map(fn);
        }
        else if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                fn.call(this, data[i], i);
            }
        }
        else {
            fn.call(this, data, 0);
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
    Xania.uuid = function () {
        if (!Xania.lut) {
            Xania.lut = [];
            for (var i = 0; i < 256; i++) {
                Xania.lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
            }
        }
        var lut = Xania.lut;
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
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
    Xania.observe = function (target, listener) {
        listener = Array.isArray(listener) ? listener.push.bind(listener) : listener;
        if (!target || typeof target !== "object")
            return target;
        if (Array.isArray(target))
            return Xania.observeArray(target, listener);
        else
            return Xania.observeObject(target, listener);
    };
    Xania.observeArray = function (target, listener) {
        var ProxyConst = window["Proxy"];
        return new ProxyConst(target, {
            get: function (target, idx) {
                listener("" + idx);
                var value = target[idx];
                return Xania.observe(value, function (member) {
                    listener(idx + "." + member);
                });
            }
        });
    };
    Xania.observeObject = function (target, listener) {
        function Spy() { }
        function __() {
            this.constructor = Spy;
        }
        ;
        if (target.constructor !== Object) {
            __.prototype = target.constructor.prototype;
            Spy.prototype = new __();
        }
        var props = Object.getOwnPropertyNames(target);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            Object.defineProperty(Spy.prototype, prop, {
                get: Xania.partialApp(function (obj, name) {
                    listener(name);
                    return Xania.observe(obj[name], function (member) {
                        listener(name + "." + member);
                    });
                }, target, prop),
                enumerable: true,
                configurable: true
            });
        }
        return new Spy;
    };
    Xania.spy = function (obj) {
        var calls = [];
        var children = {};
        function Spy() {
        }
        function __() {
            this.constructor = Spy;
        }
        ;
        __.prototype.valueOf = function () { return obj; };
        function child(name, value) {
            if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
                return value;
            }
            var ch = Xania.spy(value);
            children[name] = ch;
            return ch.create();
        }
        var props = Object.getOwnPropertyNames(obj);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            if (obj.hasOwnProperty(prop)) {
                Object.defineProperty(Spy.prototype, prop, {
                    get: Xania.partialApp(function (obj, name) {
                        calls.push(name);
                        var value = obj[name];
                        if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
                            calls.push(name);
                            return value;
                        }
                        return child(name, value);
                    }, obj, prop),
                    enumerable: true,
                    configurable: true
                });
            }
            else {
                var desc = Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop);
                if (!!desc && !!desc.get) {
                    Object.defineProperty(Spy.prototype, prop, {
                        get: Xania.partialApp(function (desc, name) {
                            return child(name, desc.get.call(this));
                        }, desc, prop),
                        enumerable: true,
                        configurable: true
                    });
                }
                else if (!!desc && !!desc.value) {
                    Spy.prototype[prop] = desc.value;
                }
            }
        }
        var observable = new Spy();
        return {
            create: function () {
                return observable;
            },
            calls: function () {
                var result = [];
                result.push.apply(result, calls);
                var keys = Object.keys(children);
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    var child = children[key];
                    var childCalls = child.calls();
                    for (var e = 0; e < childCalls.length; e++) {
                        result.push(key + "." + childCalls[e]);
                    }
                }
                return result;
            }
        };
    };
    Xania.extend = function (B) {
        function Proxy() {
        }
        var getter = function (prop) {
            return this[prop];
        };
        function __() {
            this.constructor = Proxy;
        }
        ;
        if (typeof B === "function") {
            __.prototype = B.prototype;
            Proxy.prototype = new __();
        }
        else {
            if (B.constructor !== Object) {
                __.prototype = B.constructor.prototype;
                Proxy.prototype = new __();
            }
            Proxy.prototype.map = function (fn) {
                var self = this;
                if (typeof B.map === "function")
                    return B.map.call(self, fn);
                else
                    return fn(self, 0);
            };
            Proxy.prototype.valueOf = function () { return B; };
            Proxy.prototype.toString = B.toString.bind(B);
            Object.defineProperty(Proxy.prototype, "length", {
                get: function () {
                    var length = B.length;
                    if (typeof length === "number") {
                        return length;
                    }
                    else
                        return 1;
                },
                enumerable: true,
                configurable: true
            });
            for (var baseProp in B) {
                if (B.hasOwnProperty(baseProp)) {
                    Object.defineProperty(Proxy.prototype, baseProp, {
                        get: getter.bind(B, baseProp),
                        enumerable: true,
                        configurable: true
                    });
                }
            }
        }
        var pub = {
            create: function () {
                return new Proxy;
            },
            init: function (obj) {
                for (var p in obj) {
                    if (obj.hasOwnProperty(p)) {
                        pub.prop(p, getter.bind(obj, p));
                    }
                }
                return pub;
            },
            prop: function (prop, getter) {
                Object.defineProperty(Proxy.prototype, prop, {
                    get: getter,
                    enumerable: true,
                    configurable: true
                });
                return pub;
            }
        };
        return pub;
    };
    return Xania;
})();
//# sourceMappingURL=core.js.map