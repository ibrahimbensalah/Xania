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
        this.attributes.set(name, tpl);
        return this;
    };
    TagElement.prototype.addEvent = function (name, callback) {
        this.events.set(name, callback);
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
        var result = {};
        this.attributes.forEach(function (tpl, name) {
            result[name] = tpl(context);
        });
        return result;
    };
    TagElement.prototype.executeEvents = function (context) {
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
        var itemHandler = function (item) {
            var copy = Xania.shallow(context);
            copy[_this.varName] = typeof viewModel !== "undefined" && viewModel !== null
                ? Xania.construct(viewModel, item)
                : item;
            resolve(copy);
        };
        var collectionFunc = new Function("m", "with(m) { return " + this.collectionExpr + "; }");
        for (var i = 0; i < source.length; i++) {
            var col = collectionFunc(source[i]);
            Xania.map(itemHandler, col);
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
var Xania = (function () {
    function Xania() {
    }
    Xania.identity = function (x) {
        return x;
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
    Xania.observe = function (target, deps) {
        if (!target || typeof target !== "object")
            return target;
        if (Array.isArray(target))
            return Xania.observeArray(target, deps);
        else
            return Xania.observeObject(target, deps);
    };
    Xania.observeArray = function (target, deps) {
        var ProxyConst = window["Proxy"];
        return new ProxyConst(target, {
            get: function (target, idx) {
                var value = target[idx];
                return Xania.observe(value, deps);
            }
        });
    };
    Xania.observeObject = function (target, deps) {
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
                    if (!deps.has(obj)) {
                        deps.set(obj, [name]);
                    }
                    else if (deps.get(obj).indexOf(name) < 0) {
                        deps.get(obj).push(name);
                    }
                    return Xania.observe(obj[name], deps);
                }, target, prop),
                enumerable: true,
                configurable: true
            });
        }
        return new Spy;
    };
    Xania.construct = function (viewModel, data) {
        var assign = Object.assign;
        var instance = new viewModel;
        return assign(instance, data);
    };
    Xania.shallow = function (obj) {
        var assign = Object.assign;
        return assign({}, obj);
    };
    return Xania;
})();
//# sourceMappingURL=core.js.map