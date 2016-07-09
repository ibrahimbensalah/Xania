interface IDomTemplate {
    bind(model, idx): Binding;
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

    toString() {
        return this.tpl.toString();
    }
}

class TagElement implements IDomTemplate {
    private attributes = new Map<any>();
    private events = new Map<any>();
    public data = new Map<string>();
    // ReSharper disable once InconsistentNaming
    private _children: TagElement[] = [];
    public modelAccessor: Function = Xania.identity;
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

        const itemHandler = item => {
            var result = Xania.shallow(context);
            result[this.varName] = typeof viewModel !== "undefined" && viewModel !== null
                ? Xania.extend(viewModel).init(item).create()
                : item;
            resolve(result);
        };
        const arrayHandler = data => {
            if (typeof data.map === "function") {
                data.map(itemHandler);
            } else {
                itemHandler(data);
            }
        };
        var collectionFunc = new Function("m", `with(m) { return ${this.collectionExpr}; }`);

        for (let i = 0; i < source.length; i++) {
            const col = collectionFunc(source[i]);

            if (typeof (col.then) === "function") {
                col.then(arrayHandler.bind(this));
            } else {
                arrayHandler.call(this, col);
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

class Xania {

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
        if (!Xania.lut) {
            Xania.lut = [];
            for (var i = 0; i < 256; i++) {
                Xania.lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
            }
        }
        const lut = Xania.lut;

        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    }

    static compose(...fns: any[]): Function {
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                // ReSharper disable once SuspiciousThisUsage
                result = fns[i].call(this, result);
            }
            return result;
        };
    }

    static partialApp(fn, ...partialArgs: any[]) {
        return function (...additionalArgs: any[]) {
            var args = [].concat(partialArgs, additionalArgs);

            // ReSharper disable once SuspiciousThisUsage
            return fn.apply(this, args);
        }
    }

    static observe(target, listener) {
        // ReSharper disable once InconsistentNaming
        listener = Array.isArray(listener) ? listener.push.bind(listener) : listener;

        if (!target || typeof target !== "object")
            return target;

        if (Array.isArray(target))
            return Xania.observeArray(target, listener);
        else
            return Xania.observeObject(target, listener);
    }

    static observeArray(target, listener) {
        // ReSharper disable once InconsistentNaming
        var ProxyConst = window["Proxy"];
        return new ProxyConst(target,
            {
                get(target, idx) {
                    listener(`${idx}`);
                    var value = target[idx];
                    return Xania.observe(value, member => {
                        listener(`${idx}.${member}`);
                    });
                }
            });
    }

    static observeObject(target, listener) {
        // ReSharper disable once InconsistentNaming
        function Spy() { }
        function __() { // ReSharper disable once SuspiciousThisUsage 
            this.constructor = Spy;
        };
        if (target.constructor !== Object) {
            __.prototype = target.constructor.prototype;
            Spy.prototype = new __();
        }

        const props = Object.getOwnPropertyNames(target);
        for (let i = 0; i < props.length; i++) {
            var prop = props[i];
            Object.defineProperty(Spy.prototype,
                prop,
                {
                    get: Xania.partialApp((obj, name) => {
                        listener(name);
                        // ReSharper disable once SuspiciousThisUsage
                        return Xania.observe(obj[name], member => {
                            listener(name + "." + member);
                        });
                    }, target, prop),
                    enumerable: true,
                    configurable: true
                });
        }
        return new Spy;
    }

    static spy(obj) {
        const calls = [];
        const children = {};

        function Spy() {
        }
        function __() {
            // ReSharper disable once SuspiciousThisUsage
            this.constructor = Spy;
        };
        __.prototype.valueOf = () => obj;

        function child(name, value) {
            if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
                return value;
            }

            var ch = Xania.spy(value);
            children[name] = ch;
            return ch.create();
        }

        var props = Object.getOwnPropertyNames(obj);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            if (obj.hasOwnProperty(prop)) {
                Object.defineProperty(Spy.prototype,
                    prop,
                    {
                        get: Xania.partialApp((obj, name) => {
                            calls.push(name);
                            // ReSharper disable once SuspiciousThisUsage
                            var value = obj[name];
                            if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
                                calls.push(name);
                                return value;
                            }
                            return child(name, value);
                        }, obj, prop),
                        enumerable: true,
                        configurable: true
                    });
            } else {
                var desc = Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop);
                if (!!desc && !!desc.get) {
                    Object.defineProperty(Spy.prototype,
                        prop,
                        {
                            get: Xania.partialApp(function (desc, name) {
                                // ReSharper disable once SuspiciousThisUsage
                                return child(name, desc.get.call(this));
                            }, desc, prop),
                            enumerable: true,
                            configurable: true
                        });
                }
                else if (!!desc && !!desc.value) {
                    Spy.prototype[prop] = desc.value;
                }
            }
        }

        var observable = new Spy();
        return {
            create() {
                return observable;
            },
            calls() {
                var result = [];
                result.push.apply(result, calls);
                var keys = Object.keys(children);
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    var child = children[key];
                    var childCalls = child.calls();
                    for (var e = 0; e < childCalls.length; e++) {
                        result.push(key + "." + childCalls[e]);
                    }
                }
                return result;
            }
        };
    }

    static extend(B) {
        function Proxy() {
        }

        var getter =
            function (prop) {
                // ReSharper disable once SuspiciousThisUsage
                return this[prop];
            };

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
            Proxy.prototype.toString = B.toString.bind(B);

            Object.defineProperty(Proxy.prototype, "length", {
                get: () => {
                    const length = B.length;
                    if (typeof length === "number") {
                        return length;
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

    static shallow(obj) {
        var assign = (<any>Object).assign;
        return assign({}, obj);
    }
}

// ReSharper restore InconsistentNaming
