    //class Observable implements IProvider {
    //    public length = 1;

    //    private children: Observable[] = [];

    //    constructor(private container: IProvider, private lib: any, private observer: IObserver = null) {
    //        //if (value.length !== undefined)
    //        //    throw new Error("array not allowed");
    //    }

    //    hasChanges() {
    //        return true; // this.context.hasChanges();
    //    }

    //    //notify() {
    //    //    for (var name in properties) {
    //    //        if (properties.hasOwnProperty(name)) {
    //    //            var prop = properties[name];
    //    //            prop.notify();
    //    //        }
    //    //    }
    //    //    return false;
    //    //}

    //    valueOf(): any {
    //        // return this.value.valueOf();
    //        throw new Error("");
    //    }
    //    //valueOf() {
    //    //    var obj = {};
    //    //    for (var i = 0; i < this.instances.length; i++) {
    //    //        Object.assign(obj, this.instances[i]);
    //    //    }
    //    //    return obj;
    //    //}

    //    //private property(name) {

    //    //    for (let i = 0; i < this.instances.length; i++) {
    //    //        const object = this.instances[i];
    //    //        const value = object[name];
    //    //        if (value !== undefined) {
    //    //            property = new ObjectProperty(object, name, value);
    //    //            this.properties[name] = property;
    //    //            return property;
    //    //        }
    //    //    }
    //    //    return null;
    //    //}

    //    get(name) {
    //        var value = this.container.get(name);

    //        if (!value)
    //            return this.lib[name];

    //        if (!!this.observer) {
    //            // value.subscribe(<any>this.observer);
    //            // this.observer.addDependency(value);
    //        }

    //        return new Observable(value, this.observer);
    //    }

    //    //prop(name) {
    //    //    return this.get(name);
    //    //    //var value = this.context.get(name);

    //    //    //if (!value)
    //    //    //    return this.lib[name];

    //    //    //if (!!this.observer) {
    //    //    //    value.subscribe(<any>this.observer);

    //    //    //    this.observer.addDependency(value);
    //    //    //}

    //    //    //return Observable.create(value, this.observer);
    //    //}

    //    //set(name, value) {
    //    //    for (let i = 0; i < this.instances.length; i++) {
    //    //        const object = this.instances[i];
    //    //        if (object.hasOwnProperty(name)) {
    //    //            object[name] = value;
    //    //            break;
    //    //        }
    //    //    }

    //    //    return value;
    //    //}

    //    //static create(variable: IValue, observer: IObserver): any {
    //    //    var value = variable.valueOf();

    //    //    if (value === null ||
    //    //        value === undefined ||
    //    //        typeof value === "boolean" ||
    //    //        typeof value === "number" ||
    //    //        typeof value === "string") {
    //    //        return new Observable(variable, observer);
    //    //    }
    //    //    else if (typeof value === "function") {
    //    //        return new ObservableFunction(variable, observer);
    //    //    } else if (Array.isArray(value)) {
    //    //        return new ObservableArray(variable, observer);
    //    //        //} else if (!!value.lastMutationId) {
    //    //        //    observer.addDependency({ object: value, property: "lastMutationId", value: value.lastMutationId });
    //    //        //    return value;
    //    //    } else {
    //    //        return new Observable(variable, observer);
    //    //    }
    //    //}

    //    itemAt(idx) {
    //        //if (this.value.length === undefined && idx === 0)
    //        //    return this;

    //        return new Observable(this.container.get(idx), this.observer);
    //    }

    //    //extend(object): Observable {
    //    //    if (!object) {
    //    //        return this;
    //    //    }

    //    //    return new Observable(new ExecutionContext(object, this.context), this.lib, this.observer);
    //    //}

    //    extendArray(arr) {
    //        return {
    //            length: arr.length,
    //            itemAt(idx) {
    //                return arr.itemAt(idx);
    //                // return new Observable(item, base.lib, base.observer);
    //            }
    //        }
    //    }

    //    subscribe(observer: IObserver) {
    //        if (this.observer === observer)
    //            return this;

    //        return new Observable(this.container, this.lib, observer);
    //    }
    //}


    //class ObservableArray {
    //    constructor(private value: IValue, private observer: IObserver) {
    //    }

    //    get length() {
    //        return this.value.length;
    //    }

    //    itemAt(idx) {
    //        var item = this.value.get(idx);
    //        if (!!this.observer)
    //            this.observer.addDependency(this.value);

    //        return Observable.create(item, this.observer);
    //    }

    //    filter(fn) {
    //        var arr = this.value;
    //        const result = [];
    //        var length = arr.length;
    //        for (var i = 0; i < length; i++) {
    //            var item = arr.get(i);
    //            if (!!this.observer)
    //                this.observer.addDependency(PropertyDependency.create(arr, i, item.valueOf()));

    //            var b = Util.execute(fn, item);
    //            if (b !== null && b !== undefined && b.valueOf())
    //                result.push(item);
    //        }
    //        return new ObservableArray(new Immutable(result), this.observer);
    //    }

    //    count(fn) {
    //        var arr = this.value;
    //        var count = 0;
    //        for (var i = arr.length - 1; i >= 0; i--) {
    //            var item = arr.get(i);
    //            if (!!this.observer)
    //                this.observer.addDependency(arr);

    //            if (!!Util.execute(fn, item))
    //                count++;
    //        }
    //        return count;
    //    }
    //}

    //class ObservableValue {
    //    private subscriptions = [];

    //    constructor(private value: IValue, private observer: IObserver) {
    //    }

    //    get length() {
    //        return 1;
    //    }

    //    prop(name): any {
    //        var value = this.value.get(name);
    //        if (!!this.observer) {
    //            this.subscriptions.push({ name, subscriber: this.observer });
    //            this.observer.addDependency(value);
    //        }

    //        return Observable.create(value, this.observer);
    //    }

    //    valueOf() {
    //        return this.value.valueOf();
    //    }

    //    itemAt(idx) {
    //        return this;
    //    }

    //    execute(...args) {
    //        return Observable.create(this.value.execute(args), this.observer);
    //        //const func = () => this.value.apply(this.context, args);
    //        //var value = func();
    //        //return Observable.create(null, func, value, this.observer);
    //    }

    //    subscribe(observer: IObserver) {
    //        if (this.observer === observer)
    //            return this;

    //        return new ObservableValue(this.value, observer);
    //    }

    //    toString() {
    //        return this.value;
    //    }
    //}

    //class ObservableFunction {
    //    constructor(private value: IValue, private observer: IObserver) {
    //    }

    //    execute(...args) {
    //        return Observable.create(this.value.execute(args), this.observer);
    //        //var func = () => this.func.apply(this.context, args);
    //        //var value = func();
    //        //return Observable.value(this.context, func, value, this.observer);
    //    }

    //    //prop(name): any {
    //    //    var value = this.func[name];
    //    //    if (!!this.observer)
    //    //        this.observer.addDependency({
    //    //            object: this.func,
    //    //            property: name,
    //    //            value: !!value ? value.valueOf() : value
    //    //        });

    //    //    return Observable.value(this.func, value, this.observer);
    //    //}
    //}

    //interface IExecutionContext {
    //    get(name): IValue;
    //    notify();
    //}

    //class RootContext implements IExecutionContext {

    //    constructor(private statics) {
    //    }

    //    variable(name) {
    //        return this.statics[name];
    //    }

    //    extend(instance) {
    //        return new ExecutionContext(instance, this);
    //    }

    //    update() {}
    //}

    //class ExecutionContext implements IExecutionContext {
    //    private variables = {};

    //    constructor(private instance: any, private parent: IExecutionContext) {
    //        if (instance.constructor !== Value)
    //            throw new Error("");
    //    }

    //    private existing(name: string) {
    //        return this.variables[name];
    //    }

    //    public get(name: string) {
    //        var existing = this.existing(name);
    //        if (!!existing)
    //            return existing;

    //        var value = this.instance[name];
    //        if (value !== undefined) {
    //            var v = new Value(this.instance, name, value);
    //            this.variables[name] = v;
    //            return v;
    //        }
    //        if (!!this.parent)
    //            return this.parent.get(name);

    //        return undefined;
    //    }

    //    notify() {
    //        let variables = this.variables;
    //        for (var n in variables) {
    //            if (variables.hasOwnProperty(n)) {
    //                variables[n].notify();
    //            }
    //        }
    //    }
    //}

