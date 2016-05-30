interface IDomElement {
    render(context: any): any[];
}

class TextContent implements IDomElement {
    constructor(private tpl) {

    }
    render(context): any[] {
        if (typeof this.tpl == "function")
            return [this.tpl(context)];
        else
            return [this.tpl];
    }

    renderAsync(context, resolve) {
        resolve(this.render(context));
    }
}

class TagElement implements IDomElement {
    private attributes = new Map<any>();
    private events = new Map<any>();
    public data = new Map<string>();
    private children: TagElement[] = [];
    private modelAccessor: Function = this.defaultModelAccessor.bind(this);

    constructor(public name: string) {
    }

    public attr(name: string, value: string) {
        return this.addAttribute(name, value);
    }

    public addAttribute(name: string, value: string) {

        var tpl = typeof (value) === "function"
            ? value
            : () => value;

        this.attributes.add(name, tpl);

        return this;
    }

    public addEvent(name, callback) {
        this.events.add(name, callback);
    }

    public addChild(child: TagElement) {
        this.children.push(child);
    }

    public render(context: any) {
        var result = [];
        this.renderAsync(context, tag => {
            result.push(tag);
        });
        return result;
    }

    public for(modelAccessor) {
        if (typeof modelAccessor === "string") {
            var expr = SelectManyExpression.parse(modelAccessor);

            this.modelAccessor = model => ({
                then(resolve) {
                    return expr.executeAsync({ model : model }, resolve);
                }
            });
        } else {
            this.modelAccessor = modelAccessor;
        }
        return this;
    }

    protected renderAsync(context: any, resolve: any) {
        const model = this.modelAccessor(context),
            compose = Util.compose(resolve, this.renderTag.bind(this)),
            iter = Util.map.bind(this, compose);
        if (typeof (model.then) === "function") {
            model.then(iter);
        } else {
            iter(model);
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

    private renderEvents(context) {
        var result = [];
        for (var i = 0; i < this.events.keys.length; i++) {
            var eventName = this.events.keys[i];
            var callback = this.events.elementAt(i);

            result.push({ name: eventName, handler: callback(context) });
        }

        return result;
    }

    private renderTag(context) {
        return {
            name: this.name,
            events: this.renderEvents(context),
            attributes: this.renderAttributes(context),
            children: this.renderChildren(context)
        };
    }

    private defaultModelAccessor(context) {
        var model = context || {},
            fromExpr = this.data.get("from") || this.data.get("for");

        if (!!fromExpr) {
            var expr = SelectManyExpression.parse(fromExpr);
            return {
                then(resolve) {
                    return expr.executeAsync(model,
                        src => {
                            resolve(src);
                        });
                }
            };
        } else {
            return {
                then(resolve) {
                    const arr = Array.isArray(model) ? model : [model];
                    for (let i = 0; i < arr.length; i++) {
                        resolve(arr[i]);
                    }
                }
            }
        }
    } 

    public selectManyExpr(loader): SelectManyExpression {
        const expr = this.data.get("from") || this.data.get("for");
        if (!!expr) {
            return SelectManyExpression.parse(expr);
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
            source = ensureIsArray(context.model),
            viewModel = this.getViewModel(context.loader);

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

    public getViewModel(loader) {
        if (typeof this.itemType == "undefined")
            return null;

        switch (typeof (this.itemType)) {
            case "string":
                return loader.import(this.itemType);
            case "function":
                return this.itemType;
            default:
                return Object;
        }
    }

    static parse(expr) {
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

    static map(fn: Function, data: any) {
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                fn.call(this, data[i]);
            }
        } else {
            fn.call(this, data);
        }
    }

    static compose(...fns: Function[]): Function {
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                // ReSharper disable once SuspiciousThisUsage
                result = fns[i].call(this, result);
            }
            return result;
        };
    }

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
