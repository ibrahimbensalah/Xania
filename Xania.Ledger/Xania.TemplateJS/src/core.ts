interface IDomTemplate {
    render(context: any);
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

    public render(context: any) {
        var result = [];
        this.renderAsync(context, tag => {
            result.push(tag);
        });
        return result;
    }

    protected renderAsync(context: any, resolve: any) {
        var model = context || {},
            selectManyExpr = this.selectManyExpr(context.loader);
        if (!!selectManyExpr) {
            selectManyExpr
                .executeAsync(context,
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
        return {
            name: this.tag,
            attributes: this.renderAttributes(context),
            children: this.renderChildren(context)
        };
    }

    public selectManyExpr(loader): SelectManyExpression {
        const expr = this.data.get("from");
        if (!!expr) {
            return SelectManyExpression.create(expr);
        }
        return null;
    }
}

class SelectManyExpression {
    constructor(public varName: string, private itemType: string, public collectionFunc: Function) {
    }

    execute(context) {
        var result = [];
        this.executeAsync(context, result.push.bind(result));
        return result;
    }

    executeAsync(context, resolve) {
        const ensureIsArray = SelectManyExpression.ensureIsArray,
            source = ensureIsArray(context);

        var viewModel = this.getViewModel(context);

        const arrayHandler = (src, data) => {
            var arr = ensureIsArray(data);
            for (let e = 0; e < arr.length; e++) {
                const p = Util.proxy(src);
                p.prop(this.varName, (x => {
                    return typeof viewModel !== "undefined" && viewModel !== null
                        ? Util.proxy(viewModel).init(x).create()
                        : x;
                }).bind(this, arr[e]));
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

    public getViewModel(context) {
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
    }

    static create(expr) {
        const m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            const [, varName, , itemType, , directive, sourceExpr] = m;
            return new SelectManyExpression(varName, itemType, this.createSourceFunc(directive || 'ctx', sourceExpr));
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

    static getViewModel(name, context): Function {
        const fun = new Function("m", `with(m) { return ${name}; }`);
        return fun(context);
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

        function getter(prop) {
            // ReSharper disable once SuspiciousThisUsage
            return this[prop];
        }

        function __() {
            // ReSharper disable once SuspiciousThisUsage
            this.constructor = Proxy;
        };

        if (typeof B === "function") {
            __.prototype = B.prototype;
            Proxy.prototype = new __();
        } else {
            if (B.constructor !== Object) {
                __.prototype = B.constructor.prototype;
                Proxy.prototype = new __();
            }
            var arr = Array.isArray(B) ? B : [B];
            Proxy.prototype.map = Array.prototype.map.bind(arr);

            for (let baseProp in B) {
                if (B.hasOwnProperty(baseProp)) {
                    Object.defineProperty(Proxy.prototype,
                        baseProp,
                        {
                            get: getter.bind(B, baseProp),
                            enumerable: true,
                            configurable: true
                        });
                }
            }
        }
        var pub = {
            create() {
                return new Proxy;
            },
            init(obj) {
                for (var p in obj) {
                    if (obj.hasOwnProperty(p)) {
                        pub.prop(p, getter.bind(obj, p));
                    }
                }
                return pub;
            },
            prop(prop, getter) {
                Object.defineProperty(Proxy.prototype,
                    prop,
                    {
                        get: getter,
                        enumerable: true,
                        configurable: true
                    });
                return pub;
            }
        }
        return pub;
    }
}
// ReSharper restore InconsistentNaming
