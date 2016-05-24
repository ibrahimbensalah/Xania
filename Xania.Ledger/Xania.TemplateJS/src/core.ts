interface IDomTemplate {
    render(model: any);
}

class DomTemplate implements IDomTemplate {
    private attributes = new Map<any>();
    public data = new Map<string>();
    private children: DomTemplate[] = [];

    constructor(public tag: string) {
    }

    public addAttribute(name: string, value: string) {

        var tpl = typeof (value) === "function"
            ? value
            : () => value;

        this.attributes.add(name, tpl);
    }

    public addChild(child: DomTemplate) {
        this.children.push(child);
    }

    public render(model: any) {
        var result = [];
        this.renderAsync(model, tag => {
            result.push(tag);
        });
        return result;
    }

    protected renderAsync(model: any, resolve: any) {
        if (model === null || typeof (model) === "undefined")
            return;

        const selectManyExpr = this.selectManyExpr;
        if (!!selectManyExpr) {
            selectManyExpr
                .executeAsync(model,
                    src => {
                        resolve(this.renderTag(src));
                    });
        } else {
            const arr = Array.isArray(model) ? model : [model];
            for (let i = 0; i < arr.length; i++) {
                resolve(this.renderTag(arr[i]));
            }
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
            child.renderAsync(context,
                dom => {
                    result.push(dom);
                });
        }

        return result;
    }

    private renderTag(context) {
        debugger;
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
        var result = [];
        this.executeAsync(model, result.push.bind(result));
        return result;
    }

    executeAsync(model, resolve) {
        const ensureIsArray = SelectManyExpression.ensureIsArray,
            source = ensureIsArray(model);

        const arrayHandler = (src, data) => {
            var arr = ensureIsArray(data);
            for (let e = 0; e < arr.length; e++) {
                const p = Util.proxy(src);
                p.defineProperty(this.varName, (x => { return x; }).bind(this, arr[e]));
                var obj = p.create();
                resolve(obj);
            }
        };

        for (let i = 0; i < source.length; i++) {
            const col = this.collectionFunc(source[i]);

            if (typeof (col.then) === "function") {
                col.then(arrayHandler.bind(this, source[i]));
            } else {
                arrayHandler(source[i], col);
            }
        }
    }

    static create(expr) {
        const m = expr.match(/^(\w+)\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
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
        if (directive === "url")
            return new Function("m", `with(m) { return ${sourceExpr}; }`);
        return new Function("m", `with(m) { return ${sourceExpr}; }`);
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

// ReSharper disable InconsistentNaming
class Util {

    static proxy(B) {
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
                Object.defineProperty(Proxy.prototype,
                    prop,
                    {
                        get: ((obj, p) => obj[p]).bind(this, B, prop),
                        enumerable: true,
                        configurable: true
                    });
            }
        }
        return {
            create() {
                return new Proxy;
            },
            defineProperty(prop, getter) {
                Object.defineProperty(Proxy.prototype,
                    prop,
                    {
                        get: getter,
                        enumerable: true,
                        configurable: true
                    });
            }
        }
    }
}
// ReSharper restore InconsistentNaming
