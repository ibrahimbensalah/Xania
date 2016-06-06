interface IDomElement {
    execute(context: any): any[];
}

class TextContent implements IDomElement {
    constructor(private tpl) {

    }
    execute(context): any[] {
        if (typeof this.tpl == "function")
            return this.tpl(context);
        else
            return this.tpl;
    }

    executeAsync(context, resolve) {
        resolve(this.execute(context));
    }
}

class TagElement implements IDomElement {
    private attributes = new Map<any>();
    private events = new Map<any>();
    public data = new Map<string>();
    private children: TagElement[] = [];
    private modelAccessor: Function = Util.identity;

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

    public execute(context: any) {
        var result = [];
        this.executeAsync(context, tag => {
            result.push(tag);
        });
        return result;
    }

    public for(modelAccessor) {
        if (typeof modelAccessor === "string") {
            modelAccessor = SelectManyExpression.parse(modelAccessor);
        }

        this.modelAccessor = model => ({
            then(resolve) {
                return modelAccessor.executeAsync(model, resolve);
            }
        });
        return this;
    }

    protected executeAsync(context: any, resolve: any) {
        const model = this.modelAccessor(context),
            compose = m => resolve(this.executeTag(m)),
            iter = Util.map.bind(this, compose);
        if (typeof (model.then) === "function") {
            model.then(iter);
        } else {
            iter(model);
        }
    }

    private executeAttributes(context) {
        var result = {},
            attrs = this.attributes;

        for (let i = 0; i < attrs.keys.length; i++) {
            var name = attrs.keys[i];
            var tpl = attrs.get(name);
            result[name] = tpl(context);
        }

        return result;
    }

    private executeChildren(context) {
        var result = [];

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.executeAsync(context,
                dom => {
                    result.push(dom);
                });
        }

        return result;
    }

    private executeEvents(context) {
        var result: any = {};

        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            // const setter = new Function("value", `with (this) { ${name} = value; }`).bind(context);
            result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
        }

        for (let i = 0; i < this.events.keys.length; i++) {
            const eventName = this.events.keys[i];
            const callback = this.events.elementAt(i);
            result[eventName] = callback.bind(this, context);
        }

        return result;
    }

    private executeTag(context) {
        return {
            name: this.name,
            events: this.executeEvents(context),
            attributes: this.executeAttributes(context),
            children: this.executeChildren(context)
        };
    }
}

class SelectManyExpression {
    constructor(public varName: string, private viewModel: string,
        public collectionFunc: Function, private loader: any) {
    }

    execute(context) {
        var result = [];
        this.executeAsync(context, result.push.bind(result));
        return result;
    }

    executeAsync(context, resolve) {
        const ensureIsArray = SelectManyExpression.ensureIsArray,
            source = ensureIsArray(context),
            viewModel = this.viewModel;

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

    static parse(expr, loader = t => <any>window[t]) {
        const m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            const [, varName, , itemType, , directive, sourceExpr] = m;
            var viewModel = loader(itemType);
            return new SelectManyExpression(varName, viewModel, this.createSourceFunc(directive || 'ctx', sourceExpr), loader);
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

    private static lut;

    static identity(x) {
        return x;
    }

    static map(fn: Function, data: any) {
        if (Array.isArray(data)) {
            // var result = [];
            for (let i = 0; i < data.length; i++) {
                fn.call(this, data[i]);
            }
            // return result;
        } else {
            fn.call(this, data);
        }
    }

    static collect(fn: Function, data: any) {
        if (Array.isArray(data)) {
            var result = [];
            for (let i = 0; i < data.length; i++) {
                var items = fn.call(this, data[i]);
                Array.prototype.push.apply(result, items);
            }
            return result;
        } else {
            return [ fn.call(this, data) ];
        }
    }

    static uuid() {
        if (!Util.lut) {
            Util.lut = [];
            for (var i = 0; i < 256; i++) {
                Util.lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
            }
        }
        const lut = Util.lut;

        var d0 = Math.random() * 0xffffffff | 0;
            var d1 = Math.random() * 0xffffffff | 0;
            var d2 = Math.random() * 0xffffffff | 0;
            var d3 = Math.random() * 0xffffffff | 0;
            return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
                lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
                lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
                lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
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
