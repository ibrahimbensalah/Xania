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
    DomTemplate.prototype.render = function (model) {
        var result = [];
        this.renderAsync(model, function (tag) {
            result.push(tag);
        });
        return result;
    };
    DomTemplate.prototype.renderAsync = function (model, resolve) {
        var _this = this;
        if (model === null || typeof (model) === "undefined")
            return;
        var selectManyExpr = this.selectManyExpr;
        if (!!selectManyExpr) {
            selectManyExpr
                .executeAsync(model, function (src) {
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
        debugger;
        return {
            name: this.tag,
            context: context,
            attributes: this.renderAttributes(context),
            children: this.renderChildren(context)
        };
    };
    Object.defineProperty(DomTemplate.prototype, "selectManyExpr", {
        get: function () {
            var expr = this.data.get("from");
            if (!!expr) {
                return SelectManyExpression.create(expr);
            }
            return null;
        },
        enumerable: true,
        configurable: true
    });
    return DomTemplate;
})();
var SelectManyExpression = (function () {
    function SelectManyExpression(varName, collectionFunc) {
        this.varName = varName;
        this.collectionFunc = collectionFunc;
    }
    SelectManyExpression.prototype.execute = function (model) {
        var result = [];
        this.executeAsync(model, result.push.bind(result));
        return result;
    };
    SelectManyExpression.prototype.executeAsync = function (model, resolve) {
        var _this = this;
        var ensureIsArray = SelectManyExpression.ensureIsArray, source = ensureIsArray(model);
        var arrayHandler = function (src, data) {
            var arr = ensureIsArray(data);
            for (var e = 0; e < arr.length; e++) {
                var p = Util.proxy(src);
                p.defineProperty(_this.varName, (function (x) { return x; }).bind(_this, arr[e]));
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
    SelectManyExpression.create = function (expr) {
        var m = expr.match(/^(\w+)\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            var varName = m[1], directive = m[3], sourceExpr = m[4];
            return new SelectManyExpression(varName, this.createSourceFunc(directive || 'ctx', sourceExpr));
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
    Util.proxy = function (B) {
        function Proxy() { }
        for (var k in B.constructor) {
            if (B.constructor.hasOwnProperty(k)) {
                Proxy[k] = B.constructor[k];
            }
        }
        function __() {
            // ReSharper disable once SuspiciousThisUsage
            this.constructor = Proxy;
        }
        __.prototype = B.constructor.prototype;
        Proxy.prototype = new __();
        for (var prop in B) {
            if (B.hasOwnProperty(prop)) {
                Object.defineProperty(Proxy.prototype, prop, {
                    get: (function (obj, p) { return obj[p]; }).bind(this, B, prop),
                    enumerable: true,
                    configurable: true
                });
            }
        }
        return {
            create: function () {
                return new Proxy;
            },
            defineProperty: function (prop, getter) {
                Object.defineProperty(Proxy.prototype, prop, {
                    get: getter,
                    enumerable: true,
                    configurable: true
                });
            }
        };
    };
    return Util;
})();
// ReSharper restore InconsistentNaming
//# sourceMappingURL=core.js.map