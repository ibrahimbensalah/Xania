interface IDomTemplate {
    bind(model, idx);
}

class TextContent implements IDomTemplate {
    constructor(private tpl) {
    }

    execute(context) {
        return typeof this.tpl == "function"
            ? this.tpl(context)
            : this.tpl;
    }

    bind(model, idx) {
        return new ContentBinding(this, model, idx);
    }
}

class TagElement implements IDomTemplate {
    private attributes = new Map<any>();
    private events = new Map<any>();
    public data = new Map<string>();
    // ReSharper disable once InconsistentNaming
    private _children: TagElement[] = [];
    public modelAccessor: Function = Util.identity;
    public modelIdentifier: string;

    constructor(public name: string) {
    }

    public children() {
        return this._children;
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
        this._children.push(child);
        return this;
    }

    public bind(model) {
        return new TagBinding(this, model, 0);
    }

    public for(forExpression, loader) {
        var selectManyExpr = SelectManyExpression.parse(forExpression, loader);

        this.modelIdentifier = selectManyExpr.collectionExpr;

        this.modelAccessor = model => ({
            then(resolve) {
                return selectManyExpr.executeAsync(model, resolve);
            }
        });
        return this;
    }

    public executeAttributes(context) {
        var result = {},
            attrs = this.attributes;

        for (let i = 0; i < attrs.keys.length; i++) {
            var name = attrs.keys[i];
            var tpl = attrs.get(name);
            result[name] = tpl(context);
        }

        return result;
    }

    public executeEvents(context) {
        var result: any = {};

        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
        }

        for (let i = 0; i < this.events.keys.length; i++) {
            const eventName = this.events.keys[i];
            const callback = this.events.elementAt(i);
            result[eventName] = callback.bind(this, context);
        }

        return result;
    }

}

class SelectManyExpression {
    constructor(public varName: string, private viewModel: string,
        public collectionExpr, private loader: any) {
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

        const itemHandler = (src, item) => {
            const p = Util.extend(src);
            p.prop(this.varName, (x => {
                return typeof viewModel !== "undefined" && viewModel !== null
                    ? Util.extend(viewModel).init(x).create()
                    : x;
            }).bind(this, item));
            var obj = p.create();
            resolve(obj);
        };
        const arrayHandler = (src, data) => {
            if (typeof data.map === "function") {
                data.map(item => itemHandler(src, item));
            } else {
                itemHandler(src, data);
            }
        };

        var collectionFunc = new Function("m", `with(m) { return ${this.collectionExpr}; }`);

        for (let i = 0; i < source.length; i++) {
            const col = collectionFunc(source[i]);

            if (typeof (col.then) === "function") {
                col.then(arrayHandler.bind(this, source[i]));
            } else {
                arrayHandler.call(this, source[i], col);
            }
        }
    }

    static parse(expr, loader = t => <any>window[t]) {
        const m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+in\s+((\w+)\s*:\s*)?(.*)$/i);
        if (!!m) {
            // ReSharper disable once UnusedLocals
            const [, varName, , itemType, , directive, collectionExpr] = m;
            var viewModel = loader(itemType);
            return new SelectManyExpression(
                varName,
                viewModel,
                collectionExpr,
                loader);
        }
        return null;
    }

    private static ensureIsArray(obj) {
        return Array.isArray(obj) ? obj : [obj];
    }
}

class Value {
    private obj;
    constructor(obj) {
        this.obj = obj;
    }

    valueOf() {
        return this.obj;
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
        if (typeof data.map === "function") {
            data.map(fn);
        } else if (Array.isArray(data)) {
            // var result = [];
            for (let i = 0; i < data.length; i++) {
                fn.call(this, data[i], i);
            }
            // return result;
        } else {
            fn.call(this, data, 0);
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
            return [fn.call(this, data)];
        }
    }

    static count(data) {
        if (data === null || typeof data === "undefined")
            return 0;
        return !!data.length ? data.length : 1;
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

    static extend(B, listener: any = undefined) {
        function Proxy() {
        }

        function notify(prop) {
            if (typeof listener === "function")
                listener(prop);
        }

        function getter(prop) {
            // ReSharper disable once SuspiciousThisUsage
            var value = this[prop];
            if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
                notify(prop);
            } else if (typeof value === "object") {
                return Util.extend(value,
                    x => {
                        notify(prop + "." + x);
                    })
                    .create();
            }
            return value;
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
            // var arr = Array.isArray(B) ? B : [B];
            Proxy.prototype.map = function (fn) {
                // ReSharper disable once SuspiciousThisUsage
                const self = this;
                if (typeof B.map === "function")
                    return B.map.call(self, fn);
                else
                    return fn(self, 0);
            };
            Proxy.prototype.valueOf = () => B;

            Object.defineProperty(Proxy.prototype, "length", {
                get: () => {
                    if (typeof B.length === "number") {
                        notify("length");
                        return B.length;
                    } else
                        return 1;
                },
                enumerable: true,
                configurable: true
            });

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
