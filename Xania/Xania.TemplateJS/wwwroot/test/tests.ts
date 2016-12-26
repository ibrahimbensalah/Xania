/// <reference path="../src/store.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

describe("stream", () => {
    it("scalar",
        () => {
            var arr = [];
            var stream = new Bus<string>();
            var subscription = stream.subscribe({
                onNext(v) {
                    console.log(v);
                    arr.push(v);
                }
            });

            stream.write("a");
            subscription.dispose();
            stream.write("b");

            expect(arr).toEqual(["a"]);
        });
});

class Bus<T> {

    private observers: Xania.Data.IObserver<T>[] = [];

    subscribe(observer: Xania.Data.IObserver<T>): Xania.Data.ISubscription {
        this.observers.push(observer);
        return new BusSubscription(this, observer);
    }

    detach(observer: Xania.Data.IObserver<T>) {
        var idx = this.observers.indexOf(observer);
        if (idx >= 0)
            this.observers.splice(idx, 1);
        else 
            console.warn("subscription is not found");
    }

    write(value: T) {
        for (var i = 0; i < this.observers.length; i++) {
            var obs = this.observers[i];
            obs.onNext(value);
        }
    }
}

class BusSubscription<T> implements Xania.Data.ISubscription {
    constructor(private bus: Bus<T>, private observer: Xania.Data.IObserver<T>) {
        
    }

    dispose() {
        this.bus.detach(this.observer);
    }
}

// ReSharper disable once InconsistentNaming
var ReSharperReporter = window['ReSharperReporter'];
(done => {
    window.onbeforeunload = () => done();
})(ReSharperReporter.prototype.jasmineDone);
ReSharperReporter.prototype.jasmineDone = () => void 0;