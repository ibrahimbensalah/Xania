interface IDomElement {
}

class Binder {

    static bind(rootModel: any, rootDom: IDomElement) {
        const stack = [{ dom: rootDom, viewModel: rootModel }];

        while (stack.length > 0) {
            // var current = stack.pop();
            // var dom = current.dom;
            // var viewModel = current.viewModel;
        }
    }
}

class TemplateEngine {
    private static cacheFn: any = {};

    static compile(template) {
        if (!template || !template.trim()) {
            return null;
        }

        template = template.replace(/\n/g, "\\n");
        var params = "";
        var returnExpr = template.replace(/@([a-z_][\.a-z0-9_]*)/gim, (a, b) => {
            var paramIdx = `arg${params.length}`;
            params += `var ${paramIdx} = m.${b};\n`;
            return `" + ${paramIdx} + "`;
        });

        if (params.length) {
            if (!TemplateEngine.cacheFn[returnExpr]) {
                const functionBody = `${params}return "${returnExpr}"`;
                TemplateEngine.cacheFn[returnExpr] = new Function("m", functionBody);
            }
            return TemplateEngine.cacheFn[returnExpr];
        }
        return () => returnExpr;
    }
}
