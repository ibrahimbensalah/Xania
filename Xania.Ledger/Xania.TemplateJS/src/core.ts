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
            var copy = Xania.shallow(context);
            copy[this.varName] = typeof viewModel !== "undefined" && viewModel !== null
                ? Xania.construct(viewModel, item)
                : item;
            resolve(copy);
        };

        var collectionFunc = new Function("m", `with(m) { return ${this.collectionExpr}; }`);
        for (let i = 0; i < source.length; i++) {
            const col = collectionFunc(source[i]);
            Xania.map(itemHandler, col);
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
        if (typeof data.then === "function") {
            return data.then(arr => {
                Xania.map(fn, arr);
            });
        } else if (typeof data.map === "function") {
            data.map(fn);
        } else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                fn.call(this, data[i], i);
            }
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

    static construct(viewModel, data) {
        var assign = (<any>Object).assign;
        var instance = new viewModel;
        return assign(instance, data);
    }

    static shallow(obj) {
        var assign = (<any>Object).assign;
        return assign({}, obj);
    }
}

// ReSharper restore InconsistentNaming
