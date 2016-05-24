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
            if (!TemplateEngine.cacheFn[template]) {
                var functionBody = params + "return \"" + returnExpr + "\"";
                TemplateEngine.cacheFn[template] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[template];
        }
        return function () { return returnExpr; };
    };
    TemplateEngine.cacheFn = {};
    return TemplateEngine;
})();
//# sourceMappingURL=binder.js.map