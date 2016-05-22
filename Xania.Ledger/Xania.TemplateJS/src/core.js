var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
        var source = this.getSource(model);
        return this.renderMany(source);
    };
    DomTemplate.prototype.renderMany = function (source) {
        var result = [];
        for (var i = 0; i < source.length; i++) {
            result.push(this.renderTag(source[i]));
        }
        return result;
    };
    DomTemplate.prototype.getSource = function (model) {
        if (model === null || typeof (model) === "undefined")
            return [];
        var arr = Array.isArray(model) ? model : [model];
        var selectManyExpr = this.selectManyExpr;
        if (!!selectManyExpr) {
            var result = [];
            var many = selectManyExpr.execute(model);
            for (var i = 0; i < many.length; i++) {
                result.push(many[i]);
            }
            return result;
        }
        else {
            return arr;
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
            var domElements = child.render(context);
            for (var e = 0; e < domElements.length; e++) {
                result.push(domElements[e]);
            }
        }
        return result;
    };
    DomTemplate.prototype.renderTag = function (context) {
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
        var ensureIsArray = SelectManyExpression.ensureIsArray, source = ensureIsArray(model);
        var result = [];
        for (var i = 0; i < source.length; i++) {
            var collection = ensureIsArray(this.collectionFunc(source[i]));
            for (var e = 0; e < collection.length; e++) {
                result.push(this.extend(collection[i], source[i]));
            }
        }
        return result;
    };
    SelectManyExpression.prototype.extend = function (obj, parent) {
        var r = {};
        var keys = Object.keys(parent);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            r[k] = parent[k];
        }
        r[this.varName] = obj;
        return r;
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
        if (!directive || directive === "ctx")
            return new Function("m", "with(m) { return " + sourceExpr + "; }");
        else if (directive === "url")
            return new Function("m", "with(m) { return " + sourceExpr + "; }");
    };
    return SelectManyExpression;
})();
var Binder = (function () {
    function Binder() {
    }
    Binder.bind = function (rootModel, rootDom) {
        var stack = [{ dom: rootDom, viewModel: rootModel }];
        while (stack.length > 0) {
        }
    };
    return Binder;
})();
var TemplateEngine = (function () {
    function TemplateEngine() {
    }
    TemplateEngine.compile = function (template) {
        if (!template || !template.trim()) {
            return null;
        }
        template = template.replace(/\n/g, "\\n");
        var params = "";
        var returnExpr = template.replace(/@([a-z_][\.a-z0-9_]*)/gim, function (a, b) {
            var paramIdx = "arg" + params.length;
            params += "var " + paramIdx + " = m." + b + ";\n";
            return "\" + " + paramIdx + " + \"";
        });
        if (params.length) {
            if (!TemplateEngine.cacheFn[returnExpr]) {
                var functionBody = params + "return \"" + returnExpr + "\"";
                TemplateEngine.cacheFn[returnExpr] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[returnExpr];
        }
        return function () { return returnExpr; };
    };
    TemplateEngine.cacheFn = {};
    return TemplateEngine;
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
var A = (function () {
    function A() {
    }
    Object.defineProperty(A.prototype, "test", {
        get: function () {
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    return A;
})();
var ContextObject = (function (_super) {
    __extends(ContextObject, _super);
    function ContextObject() {
        _super.apply(this, arguments);
    }
    return ContextObject;
})(A);
//# sourceMappingURL=core.js.map