export module Observables {

    export interface ISubscription {
        notify(value);
        dispose();
    }

    export interface IObservable<T> {
        subscribe(observer: IObserver<T>);
    }

    export interface IObserver<T> {
        onNext?(v: T);
        onDone?();
        onError?();
    }

    export class Observable<T> {

        public subscriptions: ISubscription[] = [];
        public current: T;

        constructor(current?: T) {
            this.current = current;
        }

        subscribe(observer: IObserver<T> | Function): ISubscription {
            var subs = new Subscription(this, observer);
            if (this.current !== undefined)
                subs.notify(this.current);
            return subs;
        }

        map<TM>(mapper: (T) => TM): MappedObservable<T, TM> {
            var observable = new MappedObservable<T, TM>(mapper);
            this.subscribe(observable);
            return observable;
        }

        notify(next: T) {
            this.current = next;
            for (var i = 0; i < this.subscriptions.length; i++) {
                this.subscriptions[i].notify(next);
            }
        }

        valueOf(): any {
            return this.current;
        }

        await() {
            var a = new Awaitable<T>(this);
            this.subscribe(a);
            return a;
        }

        change() {
            var a = new Changeable<T>(this);
            this.subscribe(a);
            return a;
        }

        get length() {
            var current: any = this.current;
            if (!current)
                return void 0;
            return current.length;
        }
    }

    class Awaitable<T> extends Observable<T> {
        constructor(private source: IObservable<T>) {
            super();
        }

        onNext(value: T | PromiseLike<T>) {
            var promise = value as PromiseLike<T>;
            if (promise && promise.then) {
                promise.then(x => this.notify(x));
            } else {
                return super.notify(value as T);
            }
        }
    }

    class Changeable<T> extends Observable<T> {
        constructor(private source: IObservable<T>) {
            super();
        }

        onNext(value: T) {
            if (value !== this.current)
                this.notify(value);
        }
    }

    class Subscription<T> implements ISubscription {

        constructor(private observable: Observable<T>, private observer: IObserver<T> | Function) {
            if (observable.subscriptions.indexOf(this) >= 0)
                throw Error("mem leak");

            observable.subscriptions.push(this);
        }

        notify(value) {
            if (typeof this.observer === "function")
                (<Function>this.observer)(value);
            else
                (<IObserver<T>>this.observer).onNext(value);

            return this;
        }

        dispose() {
            var idx = this.observable.subscriptions.indexOf(this);
            if (idx >= 0)
                this.observable.subscriptions.splice(idx, 1);
            else
                console.warn("subscription is not found");
        }
    }

    export class MappedObservable<T, TM> extends Observable<TM> {
        constructor(private mapper: (T) => TM) {
            super();
        }

        onNext(value: T) {
            super.notify(this.mapper(value));
        }
    }

    export class Timer extends Observable<number> {
        private handle;
        private currentTime = 0;

        constructor() {
            super();
            this.notify(this.currentTime);
            this.resume();
        }

        toggle() {
            if (!!this.handle)
                this.pause();
            else
                this.resume();
        }

        resume(): this {
            if (!!this.handle) {
                console.warn("timer is already running");
            } else {
                var startTime = new Date().getTime() - this.currentTime;
                var inProgress = false;
                this.handle = setInterval(
                    () => {
                        if (inProgress)
                            return;
                        try {
                            inProgress = true;
                            var currentTime = new Date().getTime();
                            this.notify(this.currentTime = (currentTime - startTime));
                        } finally {
                            inProgress = false;
                        }
                    },
                    10);
            }

            return this;
        }

        pause(): this {
            if (!!this.handle) {
                clearInterval(this.handle);
            } else {
                console.warn("timer is not running");
            }
            this.handle = null;

            return this;
        }

        toString() {
            return this.currentTime;
        }
    }

    export class Time extends Observable<number> {
        private handle;

        constructor() {
            super(Time.getTime());
            this.resume();
        }

        toggle() {
            if (this.handle)
                this.pause();
            else
                this.resume();
        }

        static getTime() {
            var d = new Date();
            return d.getTime() - (d.getTimezoneOffset() * 60 * 1000);
        }

        resume(): this {
            if (this.handle) {
                return this;
            }

            var f = () => {
                this.handle = null;
                try {
                    this.notify(Time.getTime());
                } finally {
                    this.resume();
                }
            };

            this.handle = setTimeout(f, 10);
            return this;
        }

        pause(): this {
            if (!!this.handle) {
                clearInterval(this.handle);
            }
            this.handle = null;

            return this;
        }

        toString() {
            return this.current;
        }
    }
}

export default Observables;