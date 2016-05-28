var Binder = (function () {
    function Binder(compile) {
        if (compile === void 0) { compile = TemplateEngine.compile; }
        this.compile = compile;
    }
    Binder.prototype.bind = function (rootDom, rootModel) {
        var result = [];
        var stack = [{ node: rootDom, push: Array.prototype.push.bind(result) }];
        while (stack.length > 0) {
            var cur = stack.pop();
            var node = cur.node;
            var push = cur.push;
            if (node.nodeType === 1) {
                var element = node;
                var template = new TagElement(element.tagName);
                push(template);
                for (var i = element.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: element.childNodes[i], push: template.addChild.bind(template) });
                }
            }
            else if (node.nodeType === 3) {
                var tpl = this.compile(node.textContent);
                // stack.push(child.textContent);
                // tpl = this.compileTemplate(child.textContent, childScope);
                push(new TextContent(tpl || node.textContent));
            }
        }
        console.log(result);
    };
    return Binder;
})();
var TemplateEngine = (function () {
    function TemplateEngine() {
    }
    TemplateEngine.compile = function (input) {
        if (!input || !input.trim()) {
            return null;
        }
        var template = input.replace(/\n/g, "\\n");
        var params = "";
        // var returnExpr = template.replace(/@([a-z_][\.a-z0-9_]*)/gim, (a, b) => {
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, function (a, b) {
            var paramIdx = "arg" + params.length;
            params += "var " + paramIdx + " = " + b + ";";
            return "\" + " + paramIdx + " + \"";
        });
        if (params.length > 0) {
            if (!TemplateEngine.cacheFn[input]) {
                var functionBody = "with(m) {" + params + "return \"" + returnExpr + "\"}";
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return function () { return returnExpr; };
    };
    TemplateEngine.cacheFn = {};
    return TemplateEngine;
})();
//# sourceMappingURL=binder.js.map