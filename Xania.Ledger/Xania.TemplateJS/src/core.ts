interface IDomTemplate {
    render(model:any);
}

interface IDomElement {
}

class DomTemplate implements IDomTemplate {
    private attributes = new Map<any>();
    public data = new Map<string>();
    private children: IDomTemplate[] = [];

    constructor(public tag: string) {
    }

    public addAttribute(name: string, value: string) {

        var tpl = typeof (value) === "function"
            ? value
            : () => value;

        this.attributes.add(name, tpl);
    }

    public addChild(child: IDomTemplate) {
        this.children.push(child);
    }

    public render(model: any) {
        var source = this.getSource(model);
        return this.renderMany(source);
    }

    public renderMany(source: any) {
        var result = [];

        for (var i = 0; i < source.length; i++) {
            result.push(this.renderTag(source[i]));
        }

        return result;
    }

    private getSource(model: any) {
        if (model === null || typeof (model) === "undefined")
            return [];

        const arr = Array.isArray(model) ? model : [model];

        var selectManyExpr = this.selectManyExpr;
        if (!!selectManyExpr) {
            var result = [];
            var many = selectManyExpr.execute(model);
            for (let i = 0; i < many.length; i++) {
                result.push(many[i]);
            }
            return result;
        } else {
            return arr;
        }
    }

    private renderAttributes(context) {
        var result = {},
            attrs = this.attributes;

        for (let i = 0; i < attrs.keys.length; i++) {
            var name = attrs.keys[i];
            var tpl = attrs.get(name);
            result[name] = tpl(context);
        }

        return result;
    }

    private renderChildren(context) {
        var result = [];

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var domElements = child.render(context);
            for (var e = 0; e < domElements.length; e++) {
                result.push(domElements[e]);
            }
        }

        return result;
    }

    private renderTag(context) {
        return {
            name: this.tag,
            context: context,
            attributes: this.renderAttributes(context),
            children: this.renderChildren(context)
        };
    }

    public get selectManyExpr(): SelectManyExpression {
        const expr = this.data.get("from");
        if (!!expr) {
            return SelectManyExpression.create(expr);
        }
        return null;
    }
}

class SelectManyExpression {
    constructor(public varName: string, public collectionFunc: Function) {
    }

    execute(model) {
        const ensureIsArray = SelectManyExpression.ensureIsArray,
            source = ensureIsArray(model);

        var result = [];
        for (let i = 0; i < source.length; i++) {
            const collection = ensureIsArray(this.collectionFunc(source[i]));
            for (let e = 0; e < collection.length; e++) {
                var p = Xania.proxy(source[i]);
                p.defineProperty(this.varName, (x => { return x; }).bind(this, collection[e]));
                result.push(p.create());
            }
        }
        return result;
    }

    static create(expr) {
        var m = expr.match(/^(\w+)\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            const [, varName, , directive, sourceExpr] = m;
            return new SelectManyExpression(varName, this.createSourceFunc(directive || 'ctx', sourceExpr));
        }
        return null;
    }

    private static ensureIsArray(obj) {
        return Array.isArray(obj) ? obj : [obj];
    }

    static createSourceFunc(directive, sourceExpr): Function {
        if (!directive || directive === "ctx")
            return new Function("m", `with(m) { return ${sourceExpr}; }`);
        else if (directive === "url")
            return new Function("m", `with(m) { return ${sourceExpr}; }`);
    }
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
class Map<T> {
    private items = {};
    public keys: string[] = [];

    add(key: string, child: T) {
        this.items[key] = child;
        this.keys = Object.keys(this.items);
    }

    get(key: string): T {
        return this.items[key];
    }

    get length() {
        return this.keys.length;
    }

    elementAt(i: number): T {
        var key = this.keys[i];
        return key && this.get(key);
    }
}

class Xania {
    // ReSharper disable InconsistentNaming
    static proxy(B) {
        function Proxy() { }
        for (var k in B.constructor) {
            if (B.constructor.hasOwnProperty(k)) {
                Proxy[k] = B.constructor[k];
            }
        }
        function __() { this.constructor = Proxy; }
        __.prototype = B.constructor.prototype;
        Proxy.prototype = new __();

        for (var prop in B) {
            if (B.hasOwnProperty(prop)) {
                Object.defineProperty(Proxy.prototype, prop, {
                    get: ((obj, p) => obj[p]).bind(this, B, prop),
                    enumerable: true,
                    configurable: true
                });
            }
        }
        return {
            create() { return new Proxy; },
            defineProperty(prop, getter) {
                Object.defineProperty(Proxy.prototype, prop, {
                    get: getter,
                    enumerable: true,
                    configurable: true
                });
            }
        }
    }
    // ReSharper restore InconsistentNaming
}

class A {
    get test() {
        return 1;
    }
}

class ContextObject extends A {
}