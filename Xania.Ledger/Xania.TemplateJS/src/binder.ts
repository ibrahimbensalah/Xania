class Binder {

    constructor(public compile: Function = TemplateEngine.compile) {

    }

    bind(rootDom: HTMLElement, rootModel: any) {

        var result = [];
        const stack = [{ node: <Node>rootDom, push: Array.prototype.push.bind(result) }];

        while (stack.length > 0) {
            const cur = stack.pop();
            const node: Node = cur.node;
            const push = cur.push;

            if (node.nodeType === 1) {
                var element = <HTMLElement>node;
                var template = new TagElement(element.tagName);
                push(template);

                for (let i = element.childNodes.length-1; i >= 0; i--) {
                    stack.push({ node: element.childNodes[i], push: template.addChild.bind(template) });
                }
            } else if (node.nodeType === 3) {
                const tpl = this.compile(node.textContent);
                // stack.push(child.textContent);
                // tpl = this.compileTemplate(child.textContent, childScope);
                push(new TextContent(tpl || node.textContent));
            }
        }
        console.log(result);
    }
}

class TemplateEngine {
    private static cacheFn: any = {};

    static compile(input) {
        if (!input || !input.trim()) {
            return null;
        }

        var template = input.replace(/\n/g, "\\n");
        var params = "";
        // var returnExpr = template.replace(/@([a-z_][\.a-z0-9_]*)/gim, (a, b) => {
        var returnExpr = template.replace(/@([\w\(\)\.]+)/gim, function (a, b) {
            var paramIdx = `arg${params.length}`;
            params += `var ${paramIdx} = ${b};`;
            return `" + ${paramIdx} + "`;
        });

        if (params.length > 0) {
            if (!TemplateEngine.cacheFn[input]) {
                const functionBody = `with(m) {${params}return "${returnExpr}"}`;
                TemplateEngine.cacheFn[input] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[input];
        }
        return () => returnExpr;
    }
}
