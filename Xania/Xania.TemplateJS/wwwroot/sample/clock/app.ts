
class ClockApp {
    public seconds = new Timer().start();
}

class Subscription implements Xania.Data.ISubscription {
    constructor(private observers, private observer) {

    }

    dispose() {
        var idx = this.observers.indexOf(this.observer);
        if (idx >= 0)
            this.observers.splice(idx, 1);
        else
            console.warn("subscription is not found");
    }
}

class Observable<T> {

    private observers: Xania.Data.IObserver<T>[] = [];
    private current: T;

    subscribe(observer: Xania.Data.IObserver<T>): Xania.Data.ISubscription {
        debugger;
        this.observers.push(observer);
        if (this.current !== undefined) {
            observer.onNext(this.current);
        }
        return new Subscription(this.observers, observer);
    }

    write(value: T) {
        if (this.current !== value) {
            this.current = value;
            if (this.current !== undefined)
                for (var i = 0; i < this.observers.length; i++) {
                    var obs = this.observers[i];
                    obs.onNext(value);
                }
        }
    }
}

class Timer extends Observable<number> {
    private handle;
    start() {
        var startTime = new Date().getTime();
        super.write(0);
        this.handle = setInterval(() => {
            var currentTime = new Date().getTime();
            var seconds = Math.floor((currentTime - startTime) / 1000);

            console.debug("seconds", seconds);
            super.write(seconds);
        }, 1000);

        return this;
    }
}

