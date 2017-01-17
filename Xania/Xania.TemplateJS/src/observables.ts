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

        private subscriptions: ISubscription[] = [];
        private current: T;

        subscribe(observer: IObserver<T> | Function): ISubscription {
            return new Subscription(this.subscriptions, observer).notify(this.current);
        }

        map(mapper: Function) {
            var observable = new MappedObservable<T>(mapper);
            this.subscribe(observable);
            return observable;
        }

        onNext(value: T) {
            if (this.current !== value) {
                this.current = value;
                if (this.current !== undefined)
                    for (var i = 0; i < this.subscriptions.length; i++) {
                        this.subscriptions[i].notify(this.current);
                    }
            }
        }
    }

    class Subscription<T> implements ISubscription {
        constructor(private subscriptions, private observer: IObserver<T> | Function) {
            subscriptions.push(this);
        }

        notify(value) {
            if (typeof this.observer === "function")
                (<Function>this.observer)(value);
            else
                (<IObserver<T>>this.observer).onNext(value);

            return this;
        }

        dispose() {
            var idx = this.subscriptions.indexOf(this);
            if (idx >= 0)
                this.subscriptions.splice(idx, 1);
            else
                console.warn("subscription is not found");
        }
    }

    class MappedObservable<T> extends Observable<T> {
        constructor(private mapper: Function) {
            super();
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
                this.handle = setInterval(
                    () => {
                        var currentTime = new Date().getTime();
                        super.onNext(this.currentTime = (currentTime - startTime));
                    },
                    60);
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
}