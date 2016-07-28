interface IDomTemplate {
    bind(model, idx): Binding;
    modelAccessor;
}

class TextTemplate implements IDomTemplate {
    modelAccessor;

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

class TagTemplate implements IDomTemplate {
    private attributes = new Map<string, any>();
    private events = new Map<string, any>();
    // ReSharper disable once InconsistentNaming
    private _children: TagTemplate[] = [];
    public modelAccessor: Function;// = Xania.identity;
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

        this.attributes.set(name, tpl);

        return this;
    }

    public addEvent(name, callback) {
        this.events.set(name, callback);
    }

    public addChild(child: TagTemplate) {
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
        var result = {};

        this.attributes.forEach((tpl, name) => {
            result[name] = tpl(context);
        });

        return result;
    }

    public executeEvents(context) {
        var result: any = {};

        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
        }

        this.events.forEach((callback, eventName) => {
            result[eventName] = callback.bind(this, context);
        });

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

        const itemHandler = (item, idx) => {
            var result = {};
            item = Xania.unwrap(item);

            if (this.items[idx] !== item) {
                this.items[idx] = item;

                result[this.varName] = typeof viewModel !== "undefined" && viewModel !== null
                    ? Xania.construct(viewModel, item)
                    : item;
                resolve(result, idx);
            }
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

    items: any[] = [];
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

interface IObserver {
    setRead(obj: any, prop: string);
    setChange(obj: any, prop: any);
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
        // ReSharper disable once NotAllPathsReturnValue
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

    static observe(target, observer: IObserver) {
        // ReSharper disable once InconsistentNaming
        if (!target || typeof target !== "object")
            return target;

        if (Array.isArray(target))
            return Xania.observeArray(target, observer);
        else
            return Xania.observeObject(target, observer);
    }

    static observeArray(target, observer: IObserver) {
        // ReSharper disable once InconsistentNaming
        var ProxyConst = window["Proxy"];
        return new ProxyConst(target, {
            get(target, property) {
                observer.setRead(target, property);
                return Xania.observe(target[property], observer);
            },
            set(target, property, value, receiver) {
                target[property] = value;
                observer.setChange(target, property);
                return true;
            },
            apply(target, thisArg, argumentsList) {
            }
        });
    }

    static unwrap(obj) {
        if (obj === null || typeof (obj) !== "object")
            return obj;

        if (!!obj._unwrapping)
            return obj;

        if (!!obj.isSpy) {
            return obj.valueOf();
        }

        obj._unwrapping = true;
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = Xania.unwrap(obj[prop]);
            }
        }
        delete obj._unwrapping;

        return obj;
    }

    static observeObject(target, observer: IObserver) {
        // ReSharper disable once InconsistentNaming
        function Spy() {}
        if (target.constructor !== Object) {
            function __() { // ReSharper disable once SuspiciousThisUsage 
                this.constructor = Spy;
            };
            __.prototype = target.constructor.prototype;
            Spy.prototype = new __();
        }
        Spy.prototype.valueOf = () => target;
        Object.defineProperty(Spy.prototype, "isSpy", { get() { return true; }, enumerable: false });

        const props = Object.getOwnPropertyNames(target);
        for (let i = 0; i < props.length; i++) {
            var prop = props[i];
            Object.defineProperty(Spy.prototype,
                prop,
                {
                    get: Xania.partialApp((obj, name: string) => {
                        observer.setRead(obj, name);
                        return Xania.observe(obj[name], observer);
                    }, target, prop),
                    set: Xania.partialApp((obj, name: string, value: any) => {
                        observer.setChange(obj, name);
                        obj[name] = value;
                    }, target, prop),
                    enumerable: true,
                    configurable: true
                });
        }
        return new Spy;
    }

    static construct(viewModel, data) {
        //return Xania.assign(new viewModel, data);

        function Proxy() {
        }
        function __() {
            // ReSharper disable once SuspiciousThisUsage
            this.constructor = Proxy;
        };
        __.prototype = data.constructor.prototype;
        Proxy.prototype = new __();

        for (let fn in viewModel.prototype) {
            if (viewModel.prototype.hasOwnProperty(fn)) {
                console.log(fn);
                Proxy.prototype[fn] = viewModel.prototype[fn];
            }
        }

        for (let prop in data) {
            if (data.hasOwnProperty(prop)) {
                Object.defineProperty(Proxy.prototype,
                    prop,
                    {
                        get: Xania.partialApp((obj, name) => this[name], data, prop),
                        enumerable: false,
                        configurable: false
                    }
                );
            }
        }
        Proxy.prototype.valueOf = () => Xania.construct(viewModel, data.valueOf());

        return new Proxy();
    }

    static shallow(obj) {
        return Xania.assign({}, obj);
    }

    // static assign = (<any>Object).assign;
    static assign(target, ...args) {
        for (var i = 0; i < args.length; i++) {
            const object = args[i];
            for (let prop in object) {
                if (object.hasOwnProperty(prop)) {
                    target[prop] = object[prop];
                }
            }
        }
        return target;  
    }
}

// ReSharper restore InconsistentNaming
