var TextContent = (function () {
    function TextContent(tpl) {
        this.tpl = tpl;
    }
    TextContent.prototype.render = function (context) {
        var text = typeof this.tpl == "function"
            ? this.tpl(context)
            : this.tpl;
        return document.createTextNode(text);
    };
    TextContent.prototype.executeAsync = function (context, resolve) {
        resolve(context);
    };
    TextContent.prototype.executeEvents = function (context) {
        return [];
    };
    TextContent.prototype.bindAsync = function (model, resolve) {
        return Binding.createAsync(this, model, resolve);
    };
    TextContent.prototype.children = function () {
        return [];
    };
    return TextContent;
})();
var TagElement = (function () {
    function TagElement(name) {
        this.name = name;
        this.attributes = new Map();
        this.events = new Map();
        this.data = new Map();
        // ReSharper disable once InconsistentNaming
        this._children = [];
        this.modelAccessor = Util.identity;
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
        return new Binding(this, model);
    };
    TagElement.prototype.bindAsync = function (model, resolve) {
        return Binding.createAsync(this, model, resolve);
    };
    TagElement.prototype.execute2 = function (context) {
        var result = [];
        this.executeAsync(context, function (tag) {
            result.push(tag);
        });
        return result;
    };
    TagElement.prototype.for = function (modelAccessor) {
        if (typeof modelAccessor === "string") {
            modelAccessor = SelectManyExpression.parse(modelAccessor);
        }
        this.modelAccessor = function (model) { return ({
            then: function (resolve) {
                return modelAccessor.executeAsync(model, resolve);
            }
        }); };
        return this;
    };
    TagElement.prototype.executeAsync = function (context, resolve) {
        var model = this.modelAccessor(context), iter = Util.map.bind(this, resolve);
        if (typeof (model.then) === "function") {
            model.then(iter);
        }
        else {
            iter(model);
        }
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
    TagElement.prototype.executeChildren = function (context) {
        var result = [];
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.executeAsync(context, function (dom) {
                result.push(dom);
            });
        }
        return result;
    };
    TagElement.prototype.executeEvents = function (context) {
        var result = {};
        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            // const setter = new Function("value", `with (this) { ${name} = value; }`).bind(context);
            result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
        }
        for (var i = 0; i < this.events.keys.length; i++) {
            var eventName = this.events.keys[i];
            var callback = this.events.elementAt(i);
            result[eventName] = callback.bind(this, context);
        }
        return result;
    };
    TagElement.prototype.render = function (context) {
        var elt = document.createElement(this.name);
        var attributes = this.executeAttributes(context);
        for (var attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                var domAttr = document.createAttribute(attrName);
                domAttr.value = attributes[attrName];
                elt.setAttributeNode(domAttr);
            }
        }
        return elt;
        //return {
        //    name: this.name,
        //    events: this.executeEvents(context),
        //    attributes: this.executeAttributes(context)
        //    // children: this.children // this.executeChildren(context)
        //};
    };
    return TagElement;
})();
var SelectManyExpression = (function () {
    function SelectManyExpression(varName, viewModel, collectionFunc, loader) {
        this.varName = varName;
        this.viewModel = viewModel;
        this.collectionFunc = collectionFunc;
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
        var arrayHandler = function (src, data) {
            var arr = ensureIsArray(data);
            for (var e = 0; e < arr.length; e++) {
                var p = Util.proxy(src);
                p.prop(_this.varName, (function (x) {
                    return typeof viewModel !== "undefined" && viewModel !== null
                        ? Util.proxy(viewModel).init(x).create()
                        : x;
                }).bind(_this, arr[e]));
                var obj = p.create();
                resolve(obj);
            }
        };
        for (var i = 0; i < source.length; i++) {
            var col = this.collectionFunc(source[i]);
            if (typeof (col.then) === "function") {
                col.then(arrayHandler.bind(this, source[i]));
            }
            else {
                arrayHandler(source[i], col);
            }
        }
    };
    SelectManyExpression.parse = function (expr, loader) {
        if (loader === void 0) { loader = function (t) { return window[t]; }; }
        var m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            var varName = m[1], itemType = m[3], directive = m[5], sourceExpr = m[6];
            var viewModel = loader(itemType);
            return new SelectManyExpression(varName, viewModel, this.createSourceFunc(directive || 'ctx', sourceExpr), loader);
        }
        return null;
    };
    SelectManyExpression.ensureIsArray = function (obj) {
        return Array.isArray(obj) ? obj : [obj];
    };
    SelectManyExpression.createSourceFunc = function (directive, sourceExpr) {
        if (directive === "url")
            return new Function("m", "with(m) { return " + sourceExpr + "; }");
        return new Function("m", "with(m) { return " + sourceExpr + "; }");
    };
    return SelectManyExpression;
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
// ReSharper disable InconsistentNaming
var Util = (function () {
    function Util() {
    }
    Util.identity = function (x) {
        return x;
    };
    Util.map = function (fn, data) {
        if (Array.isArray(data)) {
            // var result = [];
            for (var i = 0; i < data.length; i++) {
                fn.call(this, data[i]);
            }
        }
        else {
            fn.call(this, data);
        }
    };
    Util.collect = function (fn, data) {
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
    Util.count = function (data) {
        if (data === null || typeof data === "undefined")
            return 0;
        return !!data.length ? data.length : 1;
    };
    Util.uuid = function () {
        if (!Util.lut) {
            Util.lut = [];
            for (var i = 0; i < 256; i++) {
                Util.lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
            }
        }
        var lut = Util.lut;
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    };
    Util.compose = function () {
        var fns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fns[_i - 0] = arguments[_i];
        }
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                // ReSharper disable once SuspiciousThisUsage
                result = fns[i].call(this, result);
            }
            return result;
        };
    };
    Util.proxy = function (B) {
        function Proxy() { }
        function getter(prop) {
            // ReSharper disable once SuspiciousThisUsage
            return this[prop];
        }
        function __() {
            // ReSharper disable once SuspiciousThisUsage
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
            var arr = Array.isArray(B) ? B : [B];
            Proxy.prototype.map = Array.prototype.map.bind(arr);
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
    return Util;
})();
var SkipArray = (function () {
    function SkipArray(arr, skip) {
        if (skip === void 0) { skip = 0; }
        this.arr = arr;
        this.skip = skip;
        if (skip > arr.length)
            throw new Error("skip is greather than the length of the arr");
    }
    Object.defineProperty(SkipArray.prototype, "length", {
        get: function () {
            return this.arr.length - this.skip;
        },
        enumerable: true,
        configurable: true
    });
    SkipArray.prototype.indexOf = function (item) {
        var idx = this.arr.indexOf(item, this.skip);
        if (idx < 0)
            return idx;
        return idx - this.skip;
    };
    SkipArray.prototype.elementAt = function (idx) {
        var i = idx + this.skip;
        return Array.isArray(this.arr)
            ? this.arr[i]
            : this.arr.elementAt(i);
    };
    return SkipArray;
})();
var ReverseArray = (function () {
    function ReverseArray(arr) {
        this.arr = arr;
    }
    Object.defineProperty(ReverseArray.prototype, "length", {
        get: function () {
            return this.arr.length;
        },
        enumerable: true,
        configurable: true
    });
    ReverseArray.prototype.indexOf = function (item) {
        var idx = this.arr.indexOf(item);
        if (idx < 0)
            return idx;
        return this.arr.length - idx - 1;
    };
    ReverseArray.prototype.elementAt = function (idx) {
        var i = this.length - idx - 1;
        return Array.isArray(this.arr)
            ? this.arr[i]
            : this.arr.elementAt(i);
    };
    return ReverseArray;
})();
// ReSharper restore InconsistentNaming
//# sourceMappingURL=core.js.map