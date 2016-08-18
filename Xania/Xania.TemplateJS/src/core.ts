interface IDomTemplate {
    bind(model, idx): Binding;
    modelAccessor;
    children();
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

    bind(model) {
        return new ContentBinding(this, model);
    }

    toString() {
        return this.tpl.toString();
    }

    children() {
        return [];
    }
}

class TagTemplate implements IDomTemplate {
    private attributes = new Map<string, any>();
    private events = new Map<string, any>();
    // ReSharper disable once InconsistentNaming
    private _children: IDomTemplate[] = [];
    public modelAccessor: Function;// = Xania.identity;

    constructor(public name: string) {
    }

    public children() {
        return this._children;
    }

    public attr(name: string, value: string | Function) {
        return this.addAttribute(name, value);
    }

    public addAttribute(name: string, value: string | Function) {

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
        return new TagBinding(this, model);
    }

    public for(forExpression, loader) {
        var selectManyExpr = SelectManyExpression.parse(forExpression, loader);

        this.modelAccessor = selectManyExpr.execute.bind(selectManyExpr);

        return this;
    }

    public executeAttributes(context) {
        var result = {
            "class": []
        };

        this.attributes.forEach((tpl, name) => {
            var value = tpl(context);
            if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    result["class"].push(className);
                }
            } else if (name === "class") {
                var cls = value.split(" ");
                result["class"].push.apply(result["class"], cls);
            } else {
                result[name] = value;
            }
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

        if (collectionExpr === undefined || collectionExpr === null) {
            throw new Error("null argument exception");
        }
    }

    execute(context) {
        var collectionFunc = new Function("m", `with(m) { return ${this.collectionExpr}; }`),
            varName = this.varName;
        if (Array.isArray(context))
            throw new Error("context is Array");

        var col = collectionFunc(context);

        return Xania.promise(col).then(data => {
            var arr = Array.isArray(data) ? data : [data];

            var results = [];
            for (var i = 0; i < arr.length; i++) {
                const result = {};
                result[varName] = arr[i];

                results.push(result);
            }

            return results;
        });
    }

    static parse(expr, loader = t => <any>window[t]) {
        const m = expr.match(/^(\w+)(\s*:\s*(\w+))?\s+of\s+((\w+)\s*:\s*)?(.*)$/i);
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

    static composable(data) {
        return data !== null && data !== undefined && typeof (data.then) === "function";
    }

    static promise(data) {
        if (data !== null && data !== undefined && typeof (data.then) === "function") {
            return data;
        }

        return {
            then(resolve, ...args: any[]) {
                const result = resolve.apply(this, args.concat([data]));
                if (result === undefined)
                    return this;
                return Xania.promise(result);
            }
        };
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
                fn.call(this, data[i], i, data);
            }
        } else {
            fn.call(this, data, 0, [data]);
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

    //static uuid() {
    //    if (!Xania.lut) {
    //        Xania.lut = [];
    //        for (var i = 0; i < 256; i++) {
    //            Xania.lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    //        }
    //    }
    //    const lut = Xania.lut;

    //    var d0 = Math.random() * 0xffffffff | 0;
    //    var d1 = Math.random() * 0xffffffff | 0;
    //    var d2 = Math.random() * 0xffffffff | 0;
    //    var d3 = Math.random() * 0xffffffff | 0;
    //    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
    //        lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
    //        lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
    //        lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    //}

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
        if (!target || target.isSpy)
            return target;

        if (target.isSpy)
            throw new Error("observe observable is not allowed");

        if (typeof target === "object") {
            if (Array.isArray(target))
                return Xania.observeArray(target, observer);
            else
                return Xania.observeObject(target, observer);
        } else {
            return target;
        }
    }

    static observeArray(arr, observer: IObserver) {
        // ReSharper disable once InconsistentNaming
        var ProxyConst = window["Proxy"];
        return new ProxyConst(arr, {
            get(target, property) {
                switch (property) {
                    case "isSpy":
                        return true;
                    case "empty":
                        observer.setRead(arr, "length");
                        return arr.length === 0;
                    case "valueOf":
                        return arr.valueOf.bind(arr);
                    case "indexOf":
                        return arr.indexOf.bind(arr);
                    default:
                        return Xania.observeProperty(arr, property, observer);
                }
            },
            set(target, property, value, receiver) {
                const unwrapped = Xania.unwrap(value);
                if (arr[property] !== unwrapped) {
                    var length = arr.length;

                    arr[property] = unwrapped;
                    observer.setChange(arr, property);

                    if (arr.length !== length)
                        observer.setChange(arr, "length");
                }

                return true;
            }
        });
    }

    static unwrap(obj, cache: Set<any> = null) {
        if (obj === undefined || obj === null || typeof (obj) !== "object")
            return obj;

        if (!!cache && cache.has(obj))
            return obj;

        if (!!obj.isSpy) {
            return Xania.unwrap(obj.valueOf(), cache);
        }

        if (!cache)
            cache = new Set();
        cache.add(obj);

        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = Xania.unwrap(obj[prop], cache);
            }
        }

        return obj;
    }

    static observeObject(target, observer: IObserver) {
        // ReSharper disable once InconsistentNaming
        function Spy() { }
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
                        // ReSharper disable once SuspiciousThisUsage
                        return Xania.observeProperty(obj, name, observer);
                    }, target, prop),
                    set: Xania.partialApp((obj, name: string, value: any) => {
                        var unwrapped = Xania.unwrap(value);
                        if (obj[name] !== unwrapped) {
                            obj[name] = unwrapped;
                            observer.setChange(obj, name);
                        }
                    }, target, prop),
                    enumerable: true,
                    configurable: true
                });
        }
        return new Spy;
    }

    static observeProperty(object, propertyName, observer: IObserver) {
        var propertyValue = object[propertyName];
        if (typeof propertyValue === "function") {
            return function () {
                var proxy = Xania.observe(object, observer);
                var retval = propertyValue.apply(proxy, arguments);

                return Xania.observe(retval, observer);
            };
        } else {
            observer.setRead(object, propertyName);
            if (propertyValue === null || typeof propertyValue === "undefined") {
                return null;
            }
            else {
                return Xania.observe(propertyValue, observer);
            }
        }
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
                    });
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

    static join(separator: string, value) {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.sort().join(separator) : null;
        }
        return value;
    }
}

class Router {

    private currentAction = null;

    action(name: string) {
        if (name === null || typeof name === "undefined")
            return this.currentAction;

        return this.currentAction = name;
    }
}

// ReSharper restore InconsistentNaming
