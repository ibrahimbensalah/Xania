export module Observables {

    export interface ISubscription {
        notify(value);
        dispose();
    }

    export interface IObservable<T> {
        subscriber(observer: IObserver<T>);
    }

    export interface IObserver<T> {
        onNext?(v: T);
        onDone?();
        onError?();
    }

    export class Observable<T> implements IObserver<T> {

        public subscriptions: ISubscription[] = [];
        public current: T;

        constructor(current?: T) {
            this.current = current;
        }

        subscribe(observer: IObserver<T> | Function): ISubscription {
            return new Subscription(this, observer);
        }

        map(mapper: Function) {
            var observable = new MappedObservable<T>(mapper, this.current);
            this.subscribe(observable);
            return observable;
        }

        onNext(value: T) {
            this.current = value;
            for (var i = 0; i < this.subscriptions.length; i++) {
                this.subscriptions[i].notify(this.current);
            }
        }

        valueOf() {
            return this.current;
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

    class MappedObservable<T> extends Observable<T> {
        constructor(private mapper: Function, init) {
            super(mapper(init));
        }

        onNext(value: T): void {
            super.onNext(this.mapper(value));
        }
    }

    export class Timer extends Observable<number> {
        private handle;
        private currentTime = 0;

        constructor() {
            super();
            super.onNext(this.currentTime);
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
                            super.onNext(this.currentTime = (currentTime - startTime));
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
                    this.onNext(Time.getTime());
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