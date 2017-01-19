///// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
///// <reference path="../src/core.ts" />
///// <reference path="../src/store.ts" />
///// <reference path="../src/expression.ts" />
///// <reference path="interceptreporter.ts" />

//module D {

//    interface IAction {
//        execute();
//    }

//    interface IDispatcher {
//        dispatch(action: IAction);
//    }

//    abstract class Value implements IValue {
//        private children: IValue[] = [];

//        constructor(public name: string, public value) {
//        }

//        get(propertyName: string): IValue {
//            for (var i = 0; i < this.children.length; i++) {
//                if (this.children[i].name === propertyName)
//                    return this.children[i];
//            }

//            var initialValue = this.value[propertyName];
//            if (initialValue === void 0)
//                return void 0;

//            var child = this.create(propertyName, initialValue);
//            child.update();
//            this.children.push(child);

//            return child;
//        }

//        abstract create(propertyName: string, initialValue);
//    }

//    export class Store extends Value implements IDispatcher {
//        public readonly dirty = [];

//        constructor(value) {
//            super("root", value);
//        }

//        dispatch(action: IAction) {
//            this.dirty.push(action);
//        }

//        flush() {
//            this.dirty.forEach(d => {
//                d.execute();
//            });
//            this.dirty.length = 0;
//        }

//        create(propertyName: string, initialValue) {
//            return new Property(this, this, propertyName, initialValue);
//        }
//    }

//    class Property extends Value {
//        // list of actions to be dispatched on value change
//        public readonly observers: Xania.Data.IObserver<any>[] = [];

//        constructor(private dispatcher: IDispatcher, private parent: IValue, name, value) {
//            super(name, value);
//        }

//        create(propertyName: string, initialValue) {
//            return new Property(this.dispatcher, this, propertyName, initialValue);
//        }

//        subscribe(observer: Xania.Data.IObserver<any>): any {
//            if (this.observers.indexOf(observer) < 0) {
//                this.observers.push(observer);
//                return {
//                    observers: this.observers,
//                    item: observer,
//                    dispose() {
//                        var idx = this.observers.indexOf(this.item);
//                        if (idx < 0)
//                            return false;
//                        this.observers.splice(idx, 1);
//                        return true;
//                    }
//                }
//            }
//            return false;
//        }

//        update() {
//            var newValue = this.parent.value[this.name];
//            if (newValue === this.value)
//                return false;

//            this.value = newValue;

//            if (this.value === void 0) {
//                // notify done
//            } else {
//                // notify next
//                var observers = this.observers.slice(0);
//                for (var i = 0; i < observers.length; i++) {
//                    observers[i].onNext(this);
//                }
//            }

//            return true;
//        }

//        valueOf() {
//            return this.value;
//        }
//    }

//    interface IValue {
//        name;
//        value;
//        get(name: string): IValue;

//        // implement optional members for mutable values.
//        subscribe?(observer: Xania.Data.IObserver<any>);
//        observers?: Xania.Data.IObserver<any>[];
//        update?();
//    }

//    export class Binding implements Xania.Compile.IScope, IAction {

//        public value: any;
//        public subscriptions: Xania.Data.ISubscription[] = [];

//        constructor(private dispatcher: IDispatcher, private context: IValue) {
//        }

//        onNext() {
//            for (var i = 0; i < this.subscriptions.length; i++) {
//                this.subscriptions[i].dispose();
//            }
//            this.subscriptions.length = 0;

//            this.dispatcher.dispatch(this);
//        }

//        get(object: IValue, name: string) {
//            var value = object.get(name);
//            if (!!value && !!value.subscribe) {
//                const subscription = value.subscribe(this);
//                if (!!subscription && !!subscription.dispose) {
//                    this.subscriptions.push(subscription);
//                }
//            }
//            return value;
//        }

//        variable(name: string) {
//            return this.get(this.context, name);
//        }

//        render(value) {
//            return this;
//        }

//        execute() {
//            var firstName = new Xania.Compile.Ident("firstName");
//            var newValue = firstName.execute(this).valueOf();

//            if (this.value !== newValue) {
//                this.value = newValue;
//                this.render(newValue);
//            }
//        }
//    }
//}

//describe("reactive expressions", () => {
//    it("set value should refresh binding",
//        () => {
//            // arrange
//            var object = { firstName: "Ibrahim" };
//            var store = new D.Store(object);
//            var binding = new D.Binding(store, store);
//            var property = store.get("firstName");

//            // act: execute binding
//            binding.execute();

//            // assert
//            expect(property.value).toBe("Ibrahim");
//            expect(property.observers).toEqual([binding]);
//            expect(binding.value).toBe("Ibrahim");
//            expect(binding.subscriptions.length).toBe(1);

//            // act: change value and notify
//            object.firstName = "Ramy";
//            property.update();

//            // assert
//            expect(property.value).toBe("Ramy");
//            expect(property.observers).toEqual([]);
//            expect(store.dirty.length).toBe(1);
//            // binding value is still not updated
//            expect(binding.value).toBe("Ibrahim");
//            expect(binding.subscriptions.length).toBe(0);

//            // act: apply changes
//            store.flush();

//            // assert
//            expect(property.observers).toEqual([binding]);
//            expect(store.dirty.length).toBe(0);
//            expect(binding.value).toBe("Ramy");
//            expect(binding.subscriptions.length).toBe(1);
//        });

//    function loadtest() {
//        var object = { firstName: "Ibrahim" };
//        var store = new D.Store(object);
//        var property = store.get("firstName");

//        for (var e = 0; e < 10; e++)
//            new D.Binding(store, store).execute();

//        var run = () => {
//            var start = new Date().getTime();

//            for (var i = 0; i < 1000000; i++) {
//                // act: change value and notify
//                object.firstName = "Ramy " + i;
//                property.update();

//                if (property.observers.length > 10) {
//                    console.error("observers length > 1");
//                    return;
//                }

//                if (store.dirty.length > 10) {
//                    console.error("store.dirty.size = " + store.dirty.length);
//                    return;
//                }

//                store.flush();
//            }

//            var end = new Date().getTime();
//            console.log((end - start) / 1000);
//        };

//        run();
//        run();
//    }

//});

//describe("Observable", () => {

//    it("scalar",
//        () => {
//            var arr = [];
//            var stream = new Xania.Data.Observable<string>();
//            var subscription = stream.subscribe({
//                onNext(v) {
//                    console.log(v);
//                    arr.push(v);
//                }
//            });

//            stream.onNext("a");
//            subscription.dispose();
//            stream.onNext("b");

//            expect(arr).toEqual(["a"]);
//        });
//});

//// ReSharper restore InconsistentNaming