var DomTemplate = (function () {
    function DomTemplate(tag) {
        this.tag = tag;
        this.attributes = new Map();
        this.data = new Map();
        this.children = [];
    }
    DomTemplate.prototype.addAttribute = function (name, value) {
        var tpl = typeof (value) === "function"
            ? value
            : function () { return value; };
        this.attributes.add(name, tpl);
    };
    DomTemplate.prototype.addChild = function (child) {
        this.children.push(child);
    };
    DomTemplate.prototype.render = function (context) {
        var result = [];
        this.renderAsync(context, function (tag) {
            result.push(tag);
        });
        return result;
    };
    DomTemplate.prototype.renderAsync = function (context, resolve) {
        var _this = this;
        var model = context || {}, selectManyExpr = this.selectManyExpr(context.loader);
        if (!!selectManyExpr) {
            selectManyExpr
                .executeAsync(context, function (src) {
                resolve(_this.renderTag(src));
            });
        }
        else {
            var arr = Array.isArray(model) ? model : [model];
            for (var i = 0; i < arr.length; i++) {
                resolve(this.renderTag(arr[i]));
            }
        }
    };
    DomTemplate.prototype.renderAttributes = function (context) {
        var result = {}, attrs = this.attributes;
        for (var i = 0; i < attrs.keys.length; i++) {
            var name = attrs.keys[i];
            var tpl = attrs.get(name);
            result[name] = tpl(context);
        }
        return result;
    };
    DomTemplate.prototype.renderChildren = function (context) {
        var result = [];
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.renderAsync(context, function (dom) {
                result.push(dom);
            });
        }
        return result;
    };
    DomTemplate.prototype.renderTag = function (context) {
        return {
            name: this.tag,
            attributes: this.renderAttributes(context),
            children: this.renderChildren(context)
        };
    };
    DomTemplate.prototype.selectManyExpr = function (loader) {
        var expr = this.data.get("from");
        if (!!expr) {
            return SelectManyExpression.create(expr);
        }
        return null;
    };
    return DomTemplate;
})();
var SelectManyExpression = (function () {
    function SelectManyExpression(varName, itemType, collectionFunc) {
        this.varName = varName;
        this.itemType = itemType;
        this.collectionFunc = collectionFunc;
    }
    SelectManyExpression.prototype.execute = function (context) {
        var result = [];
        this.executeAsync(context, result.push.bind(result));
        return result;
    };
    SelectManyExpression.prototype.executeAsync = function (context, resolve) {
        var _this = this;
        var ensureIsArray = SelectManyExpression.ensureIsArray, source = ensureIsArray(context);
        var viewModel = this.getViewModel(context);
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
    SelectManyExpression.prototype.getViewModel = function (context) {
        if (typeof this.itemType == "undefined")
            return null;
        switch (typeof (this.itemType)) {
            case "string":
                return context.loader.import(this.itemType);
            case "function":
                return this.itemType;
            default:
                return Object;
        }
    };
    SelectManyExpression.create = function (expr) {
        var m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            var varName = m[1], itemType = m[3], directive = m[5], sourceExpr = m[6];
            return new SelectManyExpression(varName, itemType, this.createSourceFunc(directive || 'ctx', sourceExpr));
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
    SelectManyExpression.getViewModel = function (name, context) {
        var fun = new Function("m", "with(m) { return " + name + "; }");
        return fun(context);
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
// ReSharper restore InconsistentNaming
//# sourceMappingURL=core.js.map